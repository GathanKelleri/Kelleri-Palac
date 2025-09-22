import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { useAuth } from '../auth/auth-context';
import { MessageCircle, Plus, Search, Users } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';
import { NewChat } from './new-chat';

interface Chat {
  id: string;
  name?: string;
  isGroup: boolean;
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    createdAt: string;
  };
  lastActivity: string;
}

interface ChatListProps {
  onChatSelect: (chatId: string) => void;
  selectedChatId?: string;
}

export function ChatList({ onChatSelect, selectedChatId }: ChatListProps) {
  const { user, session } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  useEffect(() => {
    if (session) {
      loadChats();
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const loadChats = async () => {
    if (!session?.access_token) {
      return;
    }

    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/chats`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => 
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    searchQuery === ''
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Сейчас';
    } else if (diffInHours < 24) {
      return `${diffInHours}ч`;
    } else {
      return date.toLocaleDateString('ru-RU', { month: 'short', day: 'numeric' });
    }
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.name) return chat.name;
    if (chat.isGroup) return 'Групповой чат';
    return 'Личный чат';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) {
      return <Users className="h-5 w-5" />;
    }
    return <MessageCircle className="h-5 w-5" />;
  };

  if (!session) {
    return (
      <div className="h-full flex items-center justify-center p-6 text-center">
        <div className="text-muted-foreground">
          <h3>Войдите в аккаунт</h3>
          <p>Чтобы просматривать чаты, пожалуйста, авторизуйтесь.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/login'}>Войти</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex items-center space-x-3 p-3">
              <div className="h-12 w-12 bg-muted rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2>Чаты</h2>
          <Button size="sm" onClick={() => setShowNewChat(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск чатов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3>Нет чатов</h3>
            <p>Начните новый разговор</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredChats.map((chat) => (
              <motion.div
                key={chat.id}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <button
                  onClick={() => onChatSelect(chat.id)}
                  className={`w-full p-3 flex items-center space-x-3 hover:bg-accent transition-colors ${
                    selectedChatId === chat.id ? 'bg-accent' : ''
                  }`}
                >
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback>
                      {getChatAvatar(chat)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between">
                      <h3 className="truncate">
                        {getChatDisplayName(chat)}
                      </h3>
                      {chat.lastActivity && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(chat.lastActivity)}
                        </span>
                      )}
                    </div>
                    
                    {chat.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate">
                        {chat.lastMessage.content}
                      </p>
                    )}
                    
                    {chat.isGroup && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        {chat.participants.length} участников
                      </Badge>
                    )}
                  </div>
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <NewChat
          onClose={() => setShowNewChat(false)}
          onChatCreated={(chatId) => {
            setShowNewChat(false);
            onChatSelect(chatId);
            loadChats(); // Refresh chat list
          }}
        />
      )}
    </div>
  );
}