import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { useTheme } from '../theme/theme-provider';
import { Palette, Bell, Shield, Volume2, Eye } from 'lucide-react';

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [onlineStatus, setOnlineStatus] = useState(true);

  const themes = [
    { value: 'blue', label: 'Синий', color: '#3b82f6' },
    { value: 'green', label: 'Зеленый', color: '#10b981' },
    { value: 'purple', label: 'Фиолетовый', color: '#8b5cf6' },
    { value: 'pink', label: 'Розовый', color: '#ec4899' },
    { value: 'orange', label: 'Оранжевый', color: '#f59e0b' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1>Настройки</h1>
        <p className="text-muted-foreground">
          Настройте свой опыт использования Kelleri Place
        </p>
      </div>

      {/* Theme Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="h-5 w-5" />
              <span>Внешний вид</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Цветовая тема</Label>
              <div className="grid grid-cols-5 gap-3">
                {themes.map((themeOption) => (
                  <button
                    key={themeOption.value}
                    onClick={() => setTheme(themeOption.value as any)}
                    className={`relative p-3 rounded-lg border-2 transition-all ${
                      theme === themeOption.value
                        ? 'border-primary'
                        : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: themeOption.color }}
                    />
                    <span className="text-xs">{themeOption.label}</span>
                    {theme === themeOption.value && (
                      <motion.div
                        layoutId="theme-indicator"
                        className="absolute inset-0 rounded-lg border-2 border-primary"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notifications */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Уведомления</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Уведомления</Label>
                <p className="text-sm text-muted-foreground">
                  Получать уведомления о новых сообщениях
                </p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Звуки</Label>
                <p className="text-sm text-muted-foreground">
                  Воспроизводить звуки уведомлений
                </p>
              </div>
              <Switch
                checked={sounds}
                onCheckedChange={setSounds}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Приватность</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Показывать статус онлайн</Label>
                <p className="text-sm text-muted-foreground">
                  Другие пользователи смогут видеть, когда вы в сети
                </p>
              </div>
              <Switch
                checked={onlineStatus}
                onCheckedChange={setOnlineStatus}
              />
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Label>Кто может писать вам сообщения</Label>
              <Select defaultValue="everyone">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="everyone">Все пользователи</SelectItem>
                  <SelectItem value="friends">Только друзья</SelectItem>
                  <SelectItem value="nobody">Никто</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Audio & Video */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Volume2 className="h-5 w-5" />
              <span>Аудио и видео</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Микрофон</Label>
              <Select defaultValue="default">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">По умолчанию</SelectItem>
                  <SelectItem value="mic1">Встроенный микрофон</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Камера</Label>
              <Select defaultValue="default">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">По умолчанию</SelectItem>
                  <SelectItem value="cam1">Встроенная камера</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Account */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Аккаунт</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full">
              Изменить пароль
            </Button>
            <Button variant="outline" className="w-full">
              Экспорт данных
            </Button>
            <Button variant="destructive" className="w-full">
              Удалить аккаунт
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}