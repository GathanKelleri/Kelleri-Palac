import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '../auth/auth-context';
import { 
  Search, 
  Users, 
  User, 
  X,
  MessageCircle
} from 'lucide-react';
import { projectId } from '../../utils/supabase/info';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
}

interface NewChatProps {
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export function NewChat({ onClose, onChatCreated }: NewChatProps) {
  const { user, session } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [chatName, setChatName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (session) {
      loadFriends();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const loadFriends = async () => {
    if (!session?.access_token) {
      return;
    }

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
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    friend.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0 || !session?.access_token) return;

    // Limit group chats to 10 participants
    if (selectedUsers.length > 10) {
      alert('Максимальное количество участников в группе: 10');
      return;
    }

    setIsCreating(true);
    try {
      const isGroup = selectedUsers.length > 1;

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          participantIds: selectedUsers,
          name: isGroup ? chatName : null,
          isGroup,
        }),
      });

      if (response.ok) {
        const chat = await response.json();
        onChatCreated(chat.id);
      } else {
        console.error('Failed to create chat:', response.status);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
    } finally {
      setIsCreating(false);
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

  const isGroup = selectedUsers.length > 1;

  if (!session) {
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
          className="w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Авторизация требуется</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Чтобы создать чат, пожалуйста, войдите в аккаунт.
              </p>
              <Button onClick={() => window.location.href = '/login'}>Войти</Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

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
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Новый чат</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск друзей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Group chat name */}
            {isGroup && (
              <div>
                <Input
                  placeholder="Название группы (необязательно)"
                  value={chatName}
                  onChange={(e) => setChatName(e.target.value)}
                />
              </div>
            )}

            {/* Selected users */}
            {selectedUsers.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Выбрано ({selectedUsers.length}/10):
                  {selectedUsers.length >= 10 && (
                    <span className="text-destructive ml-2">Максимум достигнут</span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userId => {
                    const friend = friends.find(f => f.id === userId);
                    return friend ? (
                      <Badge
                        key={userId}
                        variant="secondary"
                        className="flex items-center space-x-1"
                      >
                        <span>{friend.name}</span>
                        <button
                          onClick={() => handleUserToggle(userId)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Friends list */}
            <ScrollArea className="h-64">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-3 p-2">
                        <div className="h-10 w-10 bg-muted rounded-full" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredFriends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>
                    {searchQuery ? 'Друзья не найдены' : 'У вас пока нет друзей'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredFriends.map(friend => (
                    <div
                      key={friend.id}
                      className={`flex items-center space-x-3 p-2 hover:bg-accent rounded-lg cursor-pointer ${
                        selectedUsers.length >= 10 && !selectedUsers.includes(friend.id) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      onClick={() => {
                        if (selectedUsers.length >= 10 && !selectedUsers.includes(friend.id)) return;
                        handleUserToggle(friend.id);
                      }}
                    >
                      <Checkbox
                        checked={selectedUsers.includes(friend.id)}
                        disabled={selectedUsers.length >= 10 && !selectedUsers.includes(friend.id)}
                        onChange={() => {
                          if (selectedUsers.length >= 10 && !selectedUsers.includes(friend.id)) return;
                          handleUserToggle(friend.id);
                        }}
                      />
                      
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={friend.avatar} />
                          <AvatarFallback>
                            {friend.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-card ${getStatusColor(friend.status)}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{friend.name}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {friend.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
              <Button
                onClick={handleCreateChat}
                disabled={selectedUsers.length === 0 || isCreating}
              >
                {isCreating ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Создание...</span>
                  </div>
                ) : (
                  <>
                    {isGroup ? <Users className="h-4 w-4 mr-2" /> : <User className="h-4 w-4 mr-2" />}
                    Создать {isGroup ? 'группу' : 'чат'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}