import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAuth } from '../auth/auth-context';
import { X, Image, Music, Loader2 } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';
// Import your login component or use a redirect if needed
// import Login from '../auth/login'; // Example

interface CreatePostProps {
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

export function CreatePost({ onClose, onPostCreated }: CreatePostProps) {
  const { user, session } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [audio, setAudio] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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
          className="w-full max-w-2xl"
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
                Чтобы создать пост, пожалуйста, войдите в аккаунт.
              </p>
              {/* Replace with your actual login component or button */}
              {/* <Login /> */}
              <Button onClick={() => window.location.href = '/login'}>Войти</Button>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    );
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAudio(e.target.files[0]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const removeAudio = () => {
    setAudio(null);
  };

  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0 && !audio) {
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('content', content);
      
      images.forEach((image, index) => {
        formData.append(`image_${index}`, image);
      });
      
      if (audio) {
        formData.append('audio', audio);
      }

      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/posts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const newPost = await response.json();
        onPostCreated(newPost);
      } else {
        console.error('Failed to create post:', response.status);
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Создать пост</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User info */}
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user?.name}</p>
                <p className="text-sm text-muted-foreground">Пост для друзей</p>
              </div>
            </div>

            {/* Content */}
            <Textarea
              placeholder="Что у вас нового?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-32 resize-none"
              disabled={isLoading}
            />

            {/* Image preview */}
            {images.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md"
                    />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={() => removeImage(index)}
                      disabled={isLoading}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Audio preview */}
            {audio && (
              <div className="flex items-center space-x-3 p-3 bg-muted rounded-md">
                <Music className="h-5 w-5 text-muted-foreground" />
                <span className="flex-1">{audio.name}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={removeAudio}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Media inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="images" className="cursor-pointer">
                  <div className="flex items-center space-x-2 p-3 border-2 border-dashed border-border rounded-md hover:border-primary transition-colors">
                    <Image className="h-5 w-5" />
                    <span>Добавить фото</span>
                  </div>
                </Label>
                <Input
                  id="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="audio" className="cursor-pointer">
                  <div className="flex items-center space-x-2 p-3 border-2 border-dashed border-border rounded-md hover:border-primary transition-colors">
                    <Music className="h-5 w-5" />
                    <span>Добавить аудио</span>
                  </div>
                </Label>
                <Input
                  id="audio"
                  type="file"
                  accept="audio/mp3,audio/mpeg"
                  onChange={handleAudioChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Отмена
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={isLoading || (!content.trim() && images.length === 0 && !audio)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Публикация...
                  </>
                ) : (
                  'Опубликовать'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}