import React from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/auth-context';
import { 
  MessageCircle, 
  Home, 
  User, 
  Settings, 
  LogOut,
  Phone,
  Users
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { user, signOut } = useAuth();

  const menuItems = [
    { id: 'feed', icon: Home, label: 'Лента' },
    { id: 'chats', icon: MessageCircle, label: 'Чаты' },
    { id: 'calls', icon: Phone, label: 'Звонки' },
    { id: 'friends', icon: Users, label: 'Друзья' },
    { id: 'profile', icon: User, label: 'Профиль' },
    { id: 'settings', icon: Settings, label: 'Настройки' },
  ];

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

  return (
    <motion.div
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="w-80 h-full bg-card border-r border-border flex flex-col"
    >
      {/* Header with user info */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div 
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card ${getStatusColor(user?.status || 'offline')}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="truncate">
              Здравствуйте, {user?.name}!
            </h3>
            <Badge variant="secondary" className="text-xs">
              {getStatusText(user?.status || 'offline')}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? 'default' : 'ghost'}
                className={`w-full justify-start h-12 ${
                  isActive 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => onTabChange(item.id)}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* Footer with logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start h-12 text-destructive hover:bg-destructive/10"
          onClick={signOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Выйти
        </Button>
      </div>
    </motion.div>
  );
}