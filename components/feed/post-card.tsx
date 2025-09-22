import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Heart, MessageCircle, Share, Play, Pause, Volume2 } from 'lucide-react';

interface PostCardProps {
  post: {
    id: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
    };
    content: string;
    images?: string[];
    audio?: string;
    likes: number;
    comments: number;
    isLiked: boolean;
    createdAt: string;
  };
  onLike: () => void;
  onViewProfile?: (userId: string) => void;
}

export function PostCard({ post, onLike, onViewProfile }: PostCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Только что';
    } else if (diffInHours < 24) {
      return `${diffInHours} ч. назад`;
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setAudioCurrentTime(audio.currentTime);
    const loaded = () => setAudioDuration(audio.duration || 0);
    const ended = () => {
      setIsAudioPlaying(false);
      setAudioCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', loaded);
    audio.addEventListener('ended', ended);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', loaded);
      audio.removeEventListener('ended', ended);
    };
  }, [post.audio]);

  const handleAudioToggle = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isAudioPlaying) {
      audio.pause();
    } else {
      audio.play().catch(error => console.error('Playback error:', error));
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  const handleSeek = ([value]: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value;
    setAudioCurrentTime(value);
  };

  return (
    <Card className="border-border/50 hover:border-border transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar 
              className="h-10 w-10 cursor-pointer"
              onClick={() => onViewProfile?.(post.author.id)}
            >
              <AvatarImage src={post.author.avatar} />
              <AvatarFallback>
                {post.author.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p 
                className="font-medium hover:text-primary transition-colors cursor-pointer"
                onClick={() => onViewProfile?.(post.author.id)}
              >
                {post.author.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDate(post.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Content */}
        {post.content && (
          <p className="whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Images */}
        {post.images && post.images.length > 0 && (
          <div className="space-y-2">
            <div className="relative">
              <img
                src={post.images[currentImageIndex]}
                alt={`Post image ${currentImageIndex + 1}`}
                className="w-full rounded-md max-h-96 object-cover"
              />
              {post.images.length > 1 && (
                <div className="absolute bottom-2 right-2">
                  <Badge variant="secondary">
                    {currentImageIndex + 1} / {post.images.length}
                  </Badge>
                </div>
              )}
            </div>
            
            {post.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {post.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className={`w-16 h-16 rounded object-cover cursor-pointer border-2 ${
                      index === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setCurrentImageIndex(index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Audio */}
        {post.audio && (
          <div className="bg-muted rounded-md p-4">
            <div className="flex items-center space-x-3">
              <Button
                size="sm"
                variant="outline"
                onClick={handleAudioToggle}
                className="flex-shrink-0"
              >
                {isAudioPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Аудио</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <span>{formatTime(audioCurrentTime)}</span>
                  <Slider
                    value={[audioCurrentTime]}
                    max={audioDuration}
                    step={1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />
                  <span>{formatTime(audioDuration)}</span>
                </div>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={post.audio}
              className="hidden"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center space-x-6 pt-2">
          <motion.div whileTap={{ scale: 0.95 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={onLike}
              className={`${
                post.isLiked 
                  ? 'text-red-500 hover:text-red-600' 
                  : 'hover:text-red-500'
              }`}
            >
              <Heart 
                className={`h-5 w-5 mr-2 ${
                  post.isLiked ? 'fill-current' : ''
                }`} 
              />
              {post.likes}
            </Button>
          </motion.div>

          <Button variant="ghost" size="sm">
            <MessageCircle className="h-5 w-5 mr-2" />
            {post.comments}
          </Button>

          <Button variant="ghost" size="sm">
            <Share className="h-5 w-5 mr-2" />
            Поделиться
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}