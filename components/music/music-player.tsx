import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX,
  Shuffle,
  Repeat,
  Heart,
  Share,
  MoreHorizontal,
  Music,
  X
} from 'lucide-react';

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  avatar?: string;
}

interface MusicPlayerProps {
  track?: Track;
  isVisible: boolean;
  onClose: () => void;
}

export function MusicPlayer({ track, isVisible, onClose }: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !track) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleTrackEnd);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleTrackEnd);
    };
  }, [track]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume / 100;
  }, [volume, isMuted]);

  const handleTrackEnd = () => {
    if (repeatMode === 'one') {
      playTrack();
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const playTrack = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleRepeat = () => {
    const modes: Array<'none' | 'one' | 'all'> = ['none', 'one', 'all'];
    const currentIndex = modes.indexOf(repeatMode);
    setRepeatMode(modes[(currentIndex + 1) % modes.length]);
  };

  const getRepeatIcon = () => {
    switch (repeatMode) {
      case 'one': return <Repeat className="h-4 w-4" />;
      case 'all': return <Repeat className="h-4 w-4" />;
      default: return <Repeat className="h-4 w-4" />;
    }
  };

  if (!track || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border"
        >
          <Card className="rounded-none border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                {/* Track Info */}
                <div className="flex items-center space-x-4 flex-1">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={track.avatar} />
                    <AvatarFallback>
                      <Music className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate">{track.title}</h4>
                    <p className="text-sm text-muted-foreground truncate">
                      {track.artist}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsLiked(!isLiked)}
                    >
                      <Heart 
                        className={`h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} 
                      />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Share className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-4 flex-2">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsShuffled(!isShuffled)}
                      className={isShuffled ? 'text-primary' : ''}
                    >
                      <Shuffle className="h-4 w-4" />
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <SkipBack className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="default"
                      size="sm"
                      onClick={playTrack}
                      className="h-10 w-10 rounded-full p-0"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    
                    <Button variant="ghost" size="sm">
                      <SkipForward className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleRepeat}
                      className={repeatMode !== 'none' ? 'text-primary' : ''}
                    >
                      {getRepeatIcon()}
                    </Button>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center space-x-3 flex-1 max-w-md">
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {formatTime(currentTime)}
                    </span>
                    
                    <Slider
                      value={[currentTime]}
                      max={duration || 100}
                      step={1}
                      onValueChange={([value]) => seekTo(value)}
                      className="flex-1"
                    />
                    
                    <span className="text-xs text-muted-foreground w-10">
                      {formatTime(duration)}
                    </span>
                  </div>
                </div>

                {/* Volume & Close */}
                <div className="flex items-center space-x-4 flex-1 justify-end">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={100}
                      step={1}
                      onValueChange={([value]) => setVolume(value)}
                      className="w-20"
                    />
                  </div>

                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Hidden audio element */}
              <audio ref={audioRef} src={track.url} preload="metadata" />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}