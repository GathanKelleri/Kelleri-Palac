import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { useAuth } from '../auth/auth-context';
import { 
  Camera, 
  Upload, 
  Save, 
  Music, 
  User, 
  Mail,
  Phone,
  MapPin,
  Calendar,
  Play,
  Pause,
  Volume2,
  X
} from 'lucide-react';

export function ProfileEditor() {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    status: user?.status || 'online',
    phone: '',
    location: '',
    birthDate: '',
  });
  
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [musicFile, setMusicFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.avatar || '');

  const statusOptions = [
    { value: 'online', label: 'В сети', color: 'bg-green-500' },
    { value: 'away', label: 'Отошел', color: 'bg-yellow-500' },
    { value: 'busy', label: 'Не беспокоить', color: 'bg-red-500' },
    { value: 'offline', label: 'Невидимый', color: 'bg-gray-500' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMusicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      setMusicFile(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // For now, just save the text data. File uploads would need additional backend setup
      const dataToSave = {
        ...formData,
        avatar: avatarPreview, // Use the preview URL for now
      };

      if (musicFile) {
        // In a real app, you'd upload the file and get a URL back
        dataToSave.music = URL.createObjectURL(musicFile);
      }

      await updateProfile(dataToSave);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMusicPlayback = () => {
    const audioElement = document.getElementById('profile-music') as HTMLAudioElement;
    if (audioElement) {
      if (isPlayingMusic) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
      setIsPlayingMusic(!isPlayingMusic);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Профиль</h1>
            <p className="text-muted-foreground">
              Настройте свою информацию и статус
            </p>
          </div>
          <Button
            variant={isEditing ? "outline" : "default"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? "Отмена" : "Редактировать"}
          </Button>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Основная информация</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview} />
                    <AvatarFallback className="text-2xl">
                      {formData.name.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Status indicator */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-card ${
                    statusOptions.find(s => s.value === formData.status)?.color || 'bg-gray-500'
                  }`} />
                  
                  {isEditing && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <Label htmlFor="name">Имя</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={!isEditing}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="status">Статус</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange('status', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-3 h-3 rounded-full ${option.color}`} />
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">О себе</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Расскажите о себе..."
                  disabled={!isEditing}
                  className="min-h-24"
                />
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Телефон</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+7 (XXX) XXX-XX-XX"
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="location">Местоположение</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="Город, Страна"
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="birthDate">Дата рождения</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Music Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Music className="h-5 w-5" />
                <span>Музыкальный раздел</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {user?.music || musicFile ? (
                <div className="space-y-4">
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
                        <span className="text-sm">
                          {musicFile ? musicFile.name : 'Моя музыка'}
                        </span>
                      </div>
                      <div className="w-full bg-background rounded-full h-1">
                        <div className="bg-primary h-1 rounded-full w-1/3 transition-all" />
                      </div>
                    </div>

                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMusicFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Hidden audio element */}
                  <audio
                    id="profile-music"
                    src={musicFile ? URL.createObjectURL(musicFile) : user?.music}
                    onEnded={() => setIsPlayingMusic(false)}
                    className="hidden"
                  />

                  {isEditing && (
                    <div>
                      <Label htmlFor="music-upload">Изменить музыку</Label>
                      <div className="mt-2">
                        <input
                          id="music-upload"
                          type="file"
                          accept="audio/mp3,audio/mpeg"
                          onChange={handleMusicChange}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('music-upload')?.click()}
                          className="w-full"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Загрузить новый MP3
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="text-muted-foreground">
                        <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <h3>Добавьте музыку в профиль</h3>
                        <p>Поделитесь своей любимой композицией</p>
                      </div>
                      <div>
                        <input
                          id="music-upload-new"
                          type="file"
                          accept="audio/mp3,audio/mpeg"
                          onChange={handleMusicChange}
                          className="hidden"
                        />
                        <Button
                          onClick={() => document.getElementById('music-upload-new')?.click()}
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Загрузить MP3
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground">
                      <Music className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3>Музыка не добавлена</h3>
                      <p>Нажмите "Редактировать", чтобы добавить музыку</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Account Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Информация аккаунта</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user?.email}</span>
                <Badge variant="secondary">Подтвержден</Badge>
              </div>
              
              <div className="flex items-center space-x-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>ID: {user?.id}</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Save Button */}
        {isEditing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Сохранение...</span>
                </div>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Сохранить изменения
                </>
              )}
            </Button>
          </motion.div>
        )}
      </div>
    </ScrollArea>
  );
}