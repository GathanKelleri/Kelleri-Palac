import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Slider } from '../ui/slider';
import { useAuth } from '../auth/auth-context';
import { 
  Send, 
  Paperclip, 
  Mic, 
  Phone, 
  Video, 
  MoreVertical,
  Image as ImageIcon,
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
  Music,
  X,
  Trash2
} from 'lucide-react';
import { projectId } from '../../utils/supabase/info';

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: 'text' | 'image' | 'audio' | 'file';
  createdAt: string;
  edited: boolean;
  editedAt?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: string[];
}

interface ChatWindowProps {
  chatId: string;
  onStartCall: (type: 'audio' | 'video') => void;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  url: string;
  duration: number;
  avatar?: string;
}

function MusicPlayer({ track }: { track: Track }) {
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

  return (
    <div className="space-y-2">
      {/* Track Info */}
      <div className="flex items-center space-x-4">
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
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
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
        <div className="flex items-center space-x-3 flex-1">
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

      {/* Volume */}
      <div className="flex items-center space-x-2 justify-end max-w-md ml-auto">
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
          className="w-32"
        />
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} src={track.url} preload="metadata" />
    </div>
  );
}

export function ChatWindow({ chatId, onStartCall }: ChatWindowProps) {
  const { user, session } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chat, setChat] = useState<Chat | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (session && chatId) {
      loadChat();
      loadMessages();
    } else {
      setIsLoading(false);
    }
  }, [chatId, session]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    if (!session?.access_token) {
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats/${chatId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const chatData = await response.json();
        setChat(chatData);
        
        // Load participants info
        const participantPromises = chatData.participants.map(async (id: string) => {
          const userResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/user/profile/${id}`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });
          return userResponse.ok ? await userResponse.json() : null;
        });
        
        const participantData = await Promise.all(participantPromises);
        setParticipants(participantData.filter(Boolean));
      } else {
        console.error('Failed to load chat:', response.status);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const loadMessages = async () => {
    if (!session?.access_token) {
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats/${chatId}/messages`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Enrich messages with sender info
        const enrichedMessages = await Promise.all(
          data.messages.map(async (message: Message) => {
            const participant = participants.find(p => p.id === message.senderId);
            if (participant) {
              return { ...message, sender: participant };
            }
            
            // If not found in participants, fetch from API
            try {
              const userResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/user/profile/${message.senderId}`, {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`,
                },
              });
              const userData = userResponse.ok ? await userResponse.json() : null;
              return { ...message, sender: userData };
            } catch {
              return message;
            }
          })
        );
        
        setMessages(enrichedMessages);
      } else {
        console.error('Failed to load messages:', response.status);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isSending || !session?.access_token) return;

    setIsSending(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content: newMessage,
          type: 'text',
        }),
      });

      if (response.ok) {
        const newMessageData = await response.json();
        setMessages(prev => [...prev, { 
          ...newMessageData, 
          sender: { 
            id: user!.id, 
            name: user!.name, 
            avatar: user!.avatar 
          } 
        }]);
        setNewMessage('');
      } else {
        console.error('Failed to send message:', response.status);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        await sendAudioMessage(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioMessage = async (audioBlob: Blob) => {
    if (!session?.access_token) return;

    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'voice_message.mp3');
      formData.append('type', 'audio');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const newMessageData = await response.json();
        setMessages(prev => [...prev, { 
          ...newMessageData, 
          sender: { 
            id: user!.id, 
            name: user!.name, 
            avatar: user!.avatar 
          } 
        }]);
      } else {
        console.error('Failed to send audio:', response.status);
      }
    } catch (error) {
      console.error('Error sending audio message:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.access_token) return;

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', file.type.startsWith('image/') ? 'image' : 'file');

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats/${chatId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const newMessageData = await response.json();
        setMessages(prev => [...prev, { 
          ...newMessageData, 
          sender: { 
            id: user!.id, 
            name: user!.name, 
            avatar: user!.avatar 
          } 
        }]);
      } else {
        console.error('Failed to send file:', response.status);
      }
    } catch (error) {
      console.error('Error sending file:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats/${chatId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        setSelectedMessageId(null);
      } else {
        console.error('Failed to delete message:', response.status);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Сегодня';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const getChatTitle = () => {
    if (chat?.name) return chat.name;
    if (chat?.isGroup) return 'Групповой чат';
    
    const otherParticipant = participants.find(p => p.id !== user?.id);
    return otherParticipant?.name || 'Личный чат';
  };

  const getOnlineParticipants = () => {
    return participants.filter(p => p.status === 'online' && p.id !== user?.id);
  };

  if (!session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <h3>Войдите в аккаунт</h3>
          <p>Чтобы использовать чат, пожалуйста, авторизуйтесь.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/login'}>Войти</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Загрузка чата...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Chat header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {chat?.isGroup ? 'Г' : participants.find(p => p.id !== user?.id)?.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3>{getChatTitle()}</h3>
            {chat?.isGroup && (
              <p className="text-sm text-muted-foreground">
                {participants.length} участников
              </p>
            )}
            {!chat?.isGroup && getOnlineParticipants().length > 0 && (
              <Badge variant="secondary" className="text-xs">
                В сети
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStartCall('audio')}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onStartCall('video')}
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showDate = !prevMessage || 
              formatDate(message.createdAt) !== formatDate(prevMessage.createdAt);
            const isOwn = message.senderId === user?.id;
            const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center my-4">
                    <Badge variant="secondary" className="text-xs">
                      {formatDate(message.createdAt)}
                    </Badge>
                  </div>
                )}
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 relative group`}
                >
                  {!isOwn && showAvatar && (
                    <Avatar className="h-8 w-8 mr-2 mt-1">
                      <AvatarImage src={message.sender?.avatar} />
                      <AvatarFallback>
                        {message.sender?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  {!isOwn && !showAvatar && <div className="w-10" />}
                  
                  <div className={`max-w-xs lg:max-w-md ${isOwn ? 'ml-auto' : ''}`}>
                    {!isOwn && showAvatar && (
                      <p className="text-xs text-muted-foreground mb-1 ml-1">
                        {message.sender?.name}
                      </p>
                    )}
                    
                    <div
                      className={`rounded-lg p-3 relative ${
                        isOwn
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {message.type === 'text' && (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      
                      {message.type === 'image' && (
                        <div className="space-y-2">
                          <img
                            src={message.content}
                            alt="Shared image"
                            className="rounded max-w-full h-auto"
                          />
                        </div>
                      )}
                      
                      {message.type === 'audio' && (
                        <MusicPlayer 
                          track={{
                            id: message.id,
                            title: 'Voice message',
                            artist: message.sender?.name || 'User',
                            url: message.content,
                            duration: 0,
                            avatar: message.sender?.avatar
                          }}
                        />
                      )}
                      
                      <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className="text-xs opacity-70">
                          {formatTime(message.createdAt)}
                        </span>
                        {isOwn && (
                          <span className="text-xs opacity-70">✓✓</span>
                        )}
                      </div>

                      {isOwn && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                          onClick={() => deleteMessage(message.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message input */}
      <div className="border-t border-border p-4">
        <div className="flex items-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          
          <div className="flex-1">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Введите сообщение..."
              disabled={isSending}
              className="resize-none"
            />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            className={isRecording ? 'bg-red-500 text-white' : ''}
          >
            <Mic className="h-4 w-4" />
          </Button>

          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim() || isSending}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileUpload}
          accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
        />
      </div>
    </div>
  );
}