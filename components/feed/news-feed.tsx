import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '../auth/auth-context';
import { CreatePost } from './create-post';
import { PostCard } from './post-card';
import { ProfileViewer } from '../profile/profile-viewer';
import { Plus, RefreshCw } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';
// Import your login component or use a redirect if needed
// import Login from '../auth/login'; // Example

interface Post {
  id: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  images?: string[];
  audio?: string;
  likes: number;
  comments: number;
  isLiked: boolean;
  createdAt: string;
}

export function NewsFeed() {
  const { user, session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      loadPosts();
      const interval = setInterval(loadPosts, 30000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [session]);

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/posts`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      } else {
        console.error('Failed to load posts:', response.status);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!session) return;
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts([newPost, ...posts]);
    setShowCreatePost(false);
  };

  const handleLike = async (postId: string) => {
    if (!session) return;
    try {
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-45c69d7e/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        setPosts(posts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                isLiked: !post.isLiked,
                likes: post.isLiked ? post.likes - 1 : post.likes + 1 
              }
            : post
        ));
      } else {
        console.error('Failed to like post:', response.status);
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6 text-center">
        <Card>
          <CardContent className="p-12">
            <h2 className="text-xl font-semibold mb-2">Войдите в аккаунт</h2>
            <p className="text-muted-foreground mb-4">
              Чтобы просматривать ленту друзей и создавать посты, пожалуйста, авторизуйтесь.
            </p>
            {/* Replace with your actual login component or button */}
            {/* <Login /> */}
            <Button onClick={() => window.location.href = '/login'}>Войти</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    // Existing skeleton code...
    return (
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-12 flex-1" />
            </div>
          </CardContent>
        </Card>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1>Лента новостей</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Create post */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback>
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <Button
              variant="outline"
              className="flex-1 justify-start text-muted-foreground"
              onClick={() => setShowCreatePost(true)}
            >
              Что у вас нового, {user?.name}?
            </Button>
            <Button
              size="sm"
              onClick={() => setShowCreatePost(true)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create post modal */}
      {showCreatePost && (
        <CreatePost
          onClose={() => setShowCreatePost(false)}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Posts */}
      <div className="space-y-6">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground">
                <h3>Пока нет постов от друзей</h3>
                <p>Создайте пост или добавьте друзей!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <PostCard
                post={post}
                onLike={() => handleLike(post.id)}
                onViewProfile={(userId) => setSelectedUserId(userId)}
              />
            </motion.div>
          ))
        )}
      </div>

      {/* Profile Viewer Modal */}
      {selectedUserId && (
        <ProfileViewer
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}
    </div>
  );
}