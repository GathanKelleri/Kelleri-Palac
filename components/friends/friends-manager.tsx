import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '../auth/auth-context';
import { ProfileViewer } from '../profile/profile-viewer';
import { 
  Search, 
  UserPlus, 
  UserCheck, 
  UserX, 
  MessageCircle,
  Phone,
  Video,
  MoreVertical,
  Users,
  User
} from 'lucide-react';
import { projectId } from '../../utils/supabase/info';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  bio?: string;
  music?: string;
}

interface FriendRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  fromUser?: User;
  toUser?: User;
}

interface FriendsManagerProps {
  onStartChat?: (chatId: string) => void;
}

export function FriendsManager({ onStartChat }: FriendsManagerProps) {
  const { user, session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('friends');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      loadFriends();
      loadFriendRequests();
    }
  }, [session]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchQuery.trim() && session) {
        searchUsers();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [searchQuery, session]);

  const searchUsers = async () => {
    if (!session?.access_token) return;

    setIsSearching(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/users/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out current user and existing friends
        const filteredUsers = data.users.filter((u: User) => 
          u.id !== user?.id && !friends.some(f => f.id === u.id)
        );
        setSearchResults(filteredUsers);
      } else {
        console.error('Failed to search users:', response.status);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const loadFriends = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/friends`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFriends(data.friends || []);
      } else {
        console.error('Failed to load friends:', response.status);
      }
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/friend-requests`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFriendRequests(data.received || []);
        setSentRequests(data.sent || []);
      } else {
        console.error('Failed to load friend requests:', response.status);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/friend-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ toUserId: userId }),
      });

      if (response.ok) {
        // Remove from search results and add to sent requests
        setSearchResults(prev => prev.filter(u => u.id !== userId));
        loadFriendRequests();
      } else {
        const errorData = await response.json();
        console.error('Error sending friend request:', errorData);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const respondToFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/friend-requests/${requestId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        loadFriendRequests();
        if (action === 'accept') {
          loadFriends();
        }
      } else {
        console.error('Failed to respond to request:', response.status);
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
    }
  };

  const removeFriend = async (friendId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/friends/${friendId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        setFriends(prev => prev.filter(f => f.id !== friendId));
      } else {
        console.error('Failed to remove friend:', response.status);
      }
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const startChat = async (friendId: string) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          participantIds: [friendId],
          isGroup: false,
        }),
      });

      if (response.ok) {
        const chat = await response.json();
        onStartChat?.(chat.id);
      } else {
        console.error('Failed to start chat:', response.status);
      }
    } catch (error) {
      console.error('Error starting chat:', error);
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

  const isRequestSent = (userId: string) => {
    return sentRequests.some(req => req.toUserId === userId && req.status === 'pending');
  };

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 h-full flex items-center justify-center text-center">
        <div className="text-muted-foreground">
          <h3>Войдите в аккаунт</h3>
          <p>Чтобы управлять друзьями, пожалуйста, авторизуйтесь.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/login'}>Войти</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h1>Друзья</h1>
        <p className="text-muted-foreground">
          Управляйте своими друзьями и находите новых людей
        </p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск пользователей по имени или email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Search results */}
          {searchQuery && (
            <div className="mt-4 space-y-2">
              {isSearching ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(searchUser => (
                  <motion.div
                    key={searchUser.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={searchUser.avatar} />
                          <AvatarFallback>
                            {searchUser.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(searchUser.status)}`} />
                      </div>
                      <div>
                        <p>{searchUser.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {searchUser.email}
                        </p>
                        {searchUser.bio && (
                          <p className="text-xs text-muted-foreground">
                            {searchUser.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(searchUser.id)}
                      disabled={isRequestSent(searchUser.id)}
                    >
                      {isRequestSent(searchUser.id) ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          Отправлено
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Добавить
                        </>
                      )}
                    </Button>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Пользователи не найдены</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends">
            Друзья ({friends.length})
          </TabsTrigger>
          <TabsTrigger value="requests">
            Заявки ({friendRequests.length})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Отправленные ({sentRequests.length})
          </TabsTrigger>
        </TabsList>

        {/* Friends list */}
        <TabsContent value="friends" className="space-y-4">
          <ScrollArea className="h-96">
            {friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3>У вас пока нет друзей</h3>
                <p>Найдите друзей через поиск выше</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friends.map(friend => (
                  <motion.div
                    key={friend.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div 
                      className="flex items-center space-x-3 flex-1 cursor-pointer"
                      onClick={() => setSelectedUserId(friend.id)}
                    >
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>
                            {friend.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(friend.status)}`} />
                      </div>
                      <div>
                        <p>{friend.name}</p>
                        <Badge variant="secondary" className="text-xs">
                          {getStatusText(friend.status)}
                        </Badge>
                        {friend.bio && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {friend.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startChat(friend.id)}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFriend(friend.id)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Friend requests */}
        <TabsContent value="requests" className="space-y-4">
          <ScrollArea className="h-96">
            {friendRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3>Нет новых заявок</h3>
                <p>Когда кто-то добавит вас в друзья, заявка появится здесь</p>
              </div>
            ) : (
              <div className="space-y-3">
                {friendRequests.map(request => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.fromUser?.avatar} />
                        <AvatarFallback>
                          {request.fromUser?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{request.fromUser?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Хочет добавить вас в друзья
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => respondToFriendRequest(request.id, 'accept')}
                      >
                        <UserCheck className="h-4 w-4 mr-2" />
                        Принять
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => respondToFriendRequest(request.id, 'reject')}
                      >
                        <UserX className="h-4 w-4 mr-2" />
                        Отклонить
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Sent requests */}
        <TabsContent value="sent" className="space-y-4">
          <ScrollArea className="h-96">
            {sentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3>Нет отправленных заявок</h3>
                <p>Заявки, которые вы отправите, будут отображаться здесь</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentRequests.map(request => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={request.toUser?.avatar} />
                        <AvatarFallback>
                          {request.toUser?.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{request.toUser?.name}</p>
                        <Badge 
                          variant={request.status === 'pending' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {request.status === 'pending' ? 'Ожидает ответа' : 'Отклонено'}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Profile Viewer Modal */}
      {selectedUserId && (
        <ProfileViewer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onStartChat={onStartChat}
        />
      )}
    </div>
  );
}