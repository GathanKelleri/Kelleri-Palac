import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '../auth/auth-context';
import { 
  User, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Music,
  UserPlus,
  UserCheck,
  MessageCircle,
  Video,
  Play,
  Pause,
  Volume2,
  X,
  ArrowLeft
} from 'lucide-react';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  phone?: string;
  location?: string;
  birthDate?: string;
  music?: string;
  createdAt: string;
}

interface ProfileViewerProps {
  userId: string;
  onClose: () => void;
  onStartChat?: (userId: string) => void;
}

export function ProfileViewer({ userId, onClose, onStartChat }: ProfileViewerProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);

  useEffect(() => {
    loadProfile();
    checkFriendshipStatus();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/user/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setProfile(userData);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkFriendshipStatus = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return;
      }

      // Check if already friends
      const friendsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/friends`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (friendsResponse.ok) {
        const friendsData = await friendsResponse.json();
        const isAlreadyFriend = friendsData.friends?.some((friend: any) => friend.id === userId);
        setIsFriend(isAlreadyFriend);
      }

      // Check for pending requests
      const requestsResponse = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/friend-requests`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const hasPending = requestsData.sent?.some((req: any) => req.toUserId === userId && req.status === 'pending');
        setHasPendingRequest(hasPending);
      }
    } catch (error) {
      console.error('Error checking friendship status:', error);
    }
  };

  const sendFriendRequest = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('No valid session found');
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/friend-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ toUserId: userId }),
      });

      if (response.ok) {
        setHasPendingRequest(true);
      } else {
        const errorData = await response.json();
        console.error('Error sending friend request:', errorData);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const startChat = async () => {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        `https://${projectId}.supabase.co`,
        publicAnonKey
      );
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        return;
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          participantIds: [userId],
          isGroup: false,
        }),
      });

      if (response.ok) {
        const chat = await response.json();
        onStartChat?.(chat.id);
        onClose();
      }
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  const toggleMusicPlayback = () => {
    const audioElement = document.getElementById('profile-viewer-music') as HTMLAudioElement;
    if (audioElement) {
      if (isPlayingMusic) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlayingMusic(!isPlayingMusic);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'В сети';
      case 'away': return 'Отошел';
      case 'busy': return 'Не беспокоить';
      default: return 'Не в сети';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p>Загрузка профиля...</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  if (!profile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="w-full max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Card>
            <CardContent className="p-6">
              <div className="text-center text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3>Профиль не найден</h3>
                <p>Возможно, пользователь был удален</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  const isOwnProfile = user?.id === userId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-2xl max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>Профиль</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <ScrollArea className="max-h-[70vh]">
            <CardContent className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={profile.avatar} />
                    <AvatarFallback className="text-2xl">
                      {profile.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-card ${getStatusColor(profile.status)}`} />
                </div>

                <div className="flex-1">
                  <h2>{profile.name}</h2>
                  <Badge variant="secondary" className="mb-2">
                    {getStatusText(profile.status)}
                  </Badge>
                  {profile.bio && (
                    <p className="text-muted-foreground">{profile.bio}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex space-x-2">
                  <Button onClick={startChat} className="flex-1">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Написать
                  </Button>
                  
                  {isFriend ? (
                    <Button variant="outline" disabled>
                      <UserCheck className="h-4 w-4 mr-2" />
                      В друзьях
                    </Button>
                  ) : hasPendingRequest ? (
                    <Button variant="outline" disabled>
                      <UserCheck className="h-4 w-4 mr-2" />
                      Заявка отправлена
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={sendFriendRequest}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Добавить в друзья
                    </Button>
                  )}
                  
                  <Button variant="outline" size="icon">
                    <Video className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4">
                <h3>Информация</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="break-all">{profile.email}</span>
                  </div>
                  
                  {profile.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                  
                  {profile.location && (
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  
                  {profile.birthDate && (
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span>{formatDate(profile.birthDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Music Section */}
              {profile.music && (
                <div className="space-y-4">
                  <h3 className="flex items-center space-x-2">
                    <Music className="h-5 w-5" />
                    <span>Музыка</span>
                  </h3>
                  
                  <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleMusicPlayback}
                      className="flex-shrink-0"
                    >
                      {isPlayingMusic ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Volume2 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Любимая композиция</span>
                      </div>
                      <div className="w-full bg-background rounded-full h-1">
                        <div className="bg-primary h-1 rounded-full w-1/3 transition-all" />
                      </div>
                    </div>
                  </div>

                  {/* Hidden audio element */}
                  <audio
                    id="profile-viewer-music"
                    src={profile.music}
                    onEnded={() => setIsPlayingMusic(false)}
                    className="hidden"
                  />
                </div>
              )}

              {/* Account Info */}
              <div className="space-y-4">
                <h3>Дополнительно</h3>
                <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>В мессенджере с {formatDate(profile.createdAt)}</span>
                </div>
              </div>
            </CardContent>
          </ScrollArea>
        </Card>
      </motion.div>
    </motion.div>
  );
}