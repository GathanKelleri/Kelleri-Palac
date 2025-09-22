import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS configuration
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Logger
app.use('*', logger(console.log));

// Initialize Supabase client with service role for auth operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Helper function to get user from token
async function getUserFromToken(authHeader: string | undefined) {
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    return error ? null : user;
  } catch {
    return null;
  }
}

// Auth routes
app.post('/make-server-45c69d7e/auth/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password and name are required' }, 400);
    }

    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      email_confirm: true // Auto-confirm email since we don't have email server configured
    });

    if (error) {
      console.log('Signup error:', error);
      return c.json({ error: error.message }, 400);
    }

    if (!data.user) {
      return c.json({ error: 'Failed to create user' }, 500);
    }

    // Store user profile in KV store
    const userProfile = {
      id: data.user.id,
      email: data.user.email,
      name,
      status: 'online',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`user:${data.user.id}`, userProfile);
    await kv.set(`user_email:${email}`, data.user.id);

    return c.json({ success: true, user: userProfile });
  } catch (error) {
    console.log('Signup error:', error);
    return c.json({ error: 'Internal server error during signup' }, 500);
  }
});

// Get user profile
app.get('/make-server-45c69d7e/user/profile/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    const profile = await kv.get(`user:${userId}`);
    
    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    // Ensure all profile fields are included with defaults
    const completeProfile = {
      ...profile,
      status: profile.status || 'offline',
      bio: profile.bio || '',
      avatar: profile.avatar || '',
      phone: profile.phone || '',
      location: profile.location || '',
      birthDate: profile.birthDate || '',
      music: profile.music || '',
      createdAt: profile.createdAt || new Date().toISOString(),
    };

    return c.json(completeProfile);
  } catch (error) {
    console.log('Error fetching user profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.put('/make-server-45c69d7e/user/profile', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${user.id}`);
    
    if (!currentProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = {
      ...currentProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`user:${user.id}`, updatedProfile);
    return c.json(updatedProfile);
  } catch (error) {
    console.log('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Get posts (feed) - now filtered for user and friends
app.get('/make-server-45c69d7e/posts', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Get friends
    const friendships = await kv.getByPrefix(`friendship:`);
    const userFriendships = friendships.filter(f => f.user1Id === user.id || f.user2Id === user.id);
    const friendIds = userFriendships.map(f => f.user1Id === user.id ? f.user2Id : f.user1Id);

    // Get all posts
    const allPosts = await kv.getByPrefix('post:');

    // Filter posts from user and friends
    const filteredPosts = allPosts.filter(post => 
      post.author.id === user.id || friendIds.includes(post.author.id)
    );

    // Sort by creation date (newest first)
    const sortedPosts = filteredPosts.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    // Add isLiked for current user
    const postsWithLikes = await Promise.all(
      sortedPosts.map(async (post) => {
        const likeKey = `like:${post.id}:${user.id}`;
        const isLiked = !!(await kv.get(likeKey));
        return { ...post, isLiked };
      })
    );

    return c.json({ posts: postsWithLikes });
  } catch (error) {
    console.log('Error fetching posts:', error);
    return c.json({ error: 'Failed to fetch posts' }, 500);
  }
});

// Create post
app.post('/make-server-45c69d7e/posts', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userProfile = await kv.get(`user:${user.id}`);
    if (!userProfile) {
      return c.json({ error: 'User profile not found' }, 404);
    }

    const formData = await c.req.formData();
    const content = formData.get('content') as string || '';

    // Handle images
    const images: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        const ext = value.name.split('.').pop() || 'jpg';
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { data, error } = await supabase.storage
          .from('posts')
          .upload(path, value, {
            contentType: value.type,
          });
        
        if (error) {
          console.error('Image upload error:', error);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path);
        images.push(publicUrl);
      }
    }

    // Handle audio
    let audio: string | null = null;
    const audioFile = formData.get('audio') as File | null;
    if (audioFile) {
      const path = `${user.id}/${crypto.randomUUID()}.mp3`;
      const { data, error } = await supabase.storage
        .from('posts')
        .upload(path, audioFile, {
          contentType: audioFile.type,
        });
      
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path);
        audio = publicUrl;
      } else {
        console.error('Audio upload error:', error);
      }
    }

    const postId = crypto.randomUUID();
    const post = {
      id: postId,
      author: {
        id: user.id,
        name: userProfile.name,
        avatar: userProfile.avatar,
      },
      content,
      images,
      audio,
      likes: 0,
      comments: 0,
      isLiked: false,
      createdAt: new Date().toISOString(),
    };

    await kv.set(`post:${postId}`, post);
    return c.json(post);
  } catch (error) {
    console.log('Error creating post:', error);
    return c.json({ error: 'Failed to create post' }, 500);
  }
});

// Like/unlike post
app.post('/make-server-45c69d7e/posts/:postId/like', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const postId = c.req.param('postId');
    const post = await kv.get(`post:${postId}`);
    
    if (!post) {
      return c.json({ error: 'Post not found' }, 404);
    }

    const likeKey = `like:${postId}:${user.id}`;
    const existingLike = await kv.get(likeKey);
    
    if (existingLike) {
      // Unlike
      await kv.del(likeKey);
      post.likes = Math.max(0, post.likes - 1);
      post.isLiked = false;
    } else {
      // Like
      await kv.set(likeKey, { userId: user.id, postId, createdAt: new Date().toISOString() });
      post.likes += 1;
      post.isLiked = true;
    }

    await kv.set(`post:${postId}`, post);
    return c.json({ success: true });
  } catch (error) {
    console.log('Error toggling like:', error);
    return c.json({ error: 'Failed to toggle like' }, 500);
  }
});

// Search users
app.get('/make-server-45c69d7e/users/search', async (c) => {
  try {
    const query = c.req.query('q');
    if (!query) {
      return c.json({ users: [] });
    }

    const allUsers = await kv.getByPrefix('user:');
    const filteredUsers = allUsers.filter(user => 
      user.name?.toLowerCase().includes(query.toLowerCase()) ||
      user.email?.toLowerCase().includes(query.toLowerCase())
    );

    return c.json({ users: filteredUsers });
  } catch (error) {
    console.log('Error searching users:', error);
    return c.json({ error: 'Failed to search users' }, 500);
  }
});

// Get single chat
app.get('/make-server-45c69d7e/chats/:chatId', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    
    // Check if user is participant in this chat
    const userChat = await kv.get(`user_chat:${user.id}:${chatId}`);
    if (!userChat) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const chat = await kv.get(`chat:${chatId}`);
    if (!chat) {
      return c.json({ error: 'Chat not found' }, 404);
    }

    return c.json(chat);
  } catch (error) {
    console.log('Error fetching chat:', error);
    return c.json({ error: 'Failed to fetch chat' }, 500);
  }
});

// Friend requests routes
app.get('/make-server-45c69d7e/friend-requests', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const receivedRequests = await kv.getByPrefix(`friend_request_to:${user.id}:`);
    const sentRequests = await kv.getByPrefix(`friend_request_from:${user.id}:`);

    // Enrich with user data
    const enrichedReceived = await Promise.all(
      receivedRequests.map(async (request) => {
        const fromUser = await kv.get(`user:${request.fromUserId}`);
        return { ...request, fromUser };
      })
    );

    const enrichedSent = await Promise.all(
      sentRequests.map(async (request) => {
        const toUser = await kv.get(`user:${request.toUserId}`);
        return { ...request, toUser };
      })
    );

    return c.json({ 
      received: enrichedReceived.filter(r => r.status === 'pending'), 
      sent: enrichedSent.filter(s => s.status === 'pending') 
    });
  } catch (error) {
    console.log('Error fetching friend requests:', error);
    return c.json({ error: 'Failed to fetch friend requests' }, 500);
  }
});

// Send friend request
app.post('/make-server-45c69d7e/friend-requests', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { toUserId } = await c.req.json();
    
    if (!toUserId) {
      return c.json({ error: 'toUserId is required' }, 400);
    }

    if (toUserId === user.id) {
      return c.json({ error: 'Cannot send friend request to yourself' }, 400);
    }

    // Check if request already exists
    const existingRequest = await kv.get(`friend_request_from:${user.id}:${toUserId}`);
    if (existingRequest && existingRequest.status === 'pending') {
      return c.json({ error: 'Friend request already sent' }, 400);
    }

    // Check if already friends
    const friendship = await kv.get(`friendship:${Math.min(user.id, toUserId)}:${Math.max(user.id, toUserId)}`);
    if (friendship) {
      return c.json({ error: 'Already friends' }, 400);
    }

    const requestId = crypto.randomUUID();
    const request = {
      id: requestId,
      fromUserId: user.id,
      toUserId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await kv.set(`friend_request_from:${user.id}:${toUserId}`, request);
    await kv.set(`friend_request_to:${toUserId}:${user.id}`, request);
    await kv.set(`friend_request:${requestId}`, request);

    return c.json(request);
  } catch (error) {
    console.log('Error sending friend request:', error);
    return c.json({ error: 'Failed to send friend request' }, 500);
  }
});

// Respond to friend request
app.put('/make-server-45c69d7e/friend-requests/:requestId', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const requestId = c.req.param('requestId');
    const { action } = await c.req.json();

    if (!['accept', 'reject'].includes(action)) {
      return c.json({ error: 'Invalid action' }, 400);
    }

    const request = await kv.get(`friend_request:${requestId}`);
    if (!request || request.toUserId !== user.id) {
      return c.json({ error: 'Friend request not found' }, 404);
    }

    // Update request status
    request.status = action === 'accept' ? 'accepted' : 'rejected';
    request.respondedAt = new Date().toISOString();

    await kv.set(`friend_request:${requestId}`, request);
    await kv.set(`friend_request_from:${request.fromUserId}:${request.toUserId}`, request);
    await kv.set(`friend_request_to:${request.toUserId}:${request.fromUserId}`, request);

    // If accepted, create friendship
    if (action === 'accept') {
      const user1 = Math.min(request.fromUserId, request.toUserId);
      const user2 = Math.max(request.fromUserId, request.toUserId);
      const friendship = {
        user1Id: user1,
        user2Id: user2,
        createdAt: new Date().toISOString(),
      };

      await kv.set(`friendship:${user1}:${user2}`, friendship);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Error responding to friend request:', error);
    return c.json({ error: 'Failed to respond to friend request' }, 500);
  }
});

// Get friends list
app.get('/make-server-45c69d7e/friends', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const friendships = await kv.getByPrefix(`friendship:`);
    const userFriendships = friendships.filter(f => f.user1Id === user.id || f.user2Id === user.id);
    const friends = await Promise.all(
      userFriendships.map(async (f) => {
        const friendId = f.user1Id === user.id ? f.user2Id : f.user1Id;
        return await kv.get(`user:${friendId}`);
      })
    );

    return c.json({ friends: friends.filter(Boolean) });
  } catch (error) {
    console.log('Error fetching friends:', error);
    return c.json({ error: 'Failed to fetch friends' }, 500);
  }
});

// Remove friend
app.delete('/make-server-45c69d7e/friends/:friendId', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const friendId = c.req.param('friendId');
    const user1 = Math.min(user.id, friendId);
    const user2 = Math.max(user.id, friendId);

    await kv.del(`friendship:${user1}:${user2}`);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error removing friend:', error);
    return c.json({ error: 'Failed to remove friend' }, 500);
  }
});

// Get chats for user
app.get('/make-server-45c69d7e/chats', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userChats = await kv.getByPrefix(`user_chat:${user.id}:`);
    const chats = await Promise.all(
      userChats.map(async (uc) => await kv.get(`chat:${uc.chatId}`))
    );

    // Sort chats by lastActivity descending
    const sortedChats = chats.filter(Boolean).sort((a, b) => 
      new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
    );

    return c.json({ chats: sortedChats });
  } catch (error) {
    console.log('Error fetching chats:', error);
    return c.json({ error: 'Failed to fetch chats' }, 500);
  }
});

// Create chat
app.post('/make-server-45c69d7e/chats', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { participantIds, name, isGroup } = await c.req.json();
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
      return c.json({ error: 'participantIds required' }, 400);
    }

    // For personal chat, check if exists
    if (!isGroup && participantIds.length === 1) {
      const otherUserId = participantIds[0];
      const userChats = await kv.getByPrefix(`user_chat:${user.id}:`);
      for (const uc of userChats) {
        const chat = await kv.get(`chat:${uc.chatId}`);
        if (chat && !chat.isGroup && chat.participants.includes(otherUserId)) {
          return c.json(chat); // Return existing chat
        }
      }
    }

    const chatId = crypto.randomUUID();
    const participants = [...new Set([user.id, ...participantIds])]; // Dedupe
    const chat = {
      id: chatId,
      name: name || null,
      isGroup: isGroup || participants.length > 2,
      participants,
      createdAt: new Date().toISOString(),
      lastMessage: null,
      lastActivity: new Date().toISOString(),
    };

    await kv.set(`chat:${chatId}`, chat);
    
    // Add chat reference for each participant
    for (const participantId of participants) {
      await kv.set(`user_chat:${participantId}:${chatId}`, { chatId, joinedAt: new Date().toISOString() });
    }

    return c.json(chat);
  } catch (error) {
    console.log('Error creating chat:', error);
    return c.json({ error: 'Failed to create chat' }, 500);
  }
});

// Get messages for chat
app.get('/make-server-45c69d7e/chats/:chatId/messages', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    
    // Check if user is participant in this chat
    const userChat = await kv.get(`user_chat:${user.id}:${chatId}`);
    if (!userChat) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const messages = await kv.getByPrefix(`message:${chatId}:`);
    const sortedMessages = messages.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return c.json({ messages: sortedMessages });
  } catch (error) {
    console.log('Error fetching messages:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Send message
app.post('/make-server-45c69d7e/chats/:chatId/messages', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    
    // Check if user is participant in this chat
    const userChat = await kv.get(`user_chat:${user.id}:${chatId}`);
    if (!userChat) {
      return c.json({ error: 'Access denied' }, 403);
    }

    let content: string;
    let type = 'text';

    const contentType = c.req.header('Content-Type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await c.req.formData();
      content = formData.get('content') as string || '';
      type = formData.get('type') as string || 'file';

      const fileKey = type === 'audio' ? 'audio' : 'file';
      const file = formData.get(fileKey) as File | null;
      if (file) {
        const ext = file.name.split('.').pop() || 'bin';
        const path = `${chatId}/${crypto.randomUUID()}.${ext}`;
        const { data, error } = await supabase.storage
          .from('messages')
          .upload(path, file, {
            contentType: file.type,
          });
        
        if (error) {
          console.error('File upload error:', error);
          return c.json({ error: 'Failed to upload file' }, 500);
        }

        const { data: { publicUrl } } = supabase.storage.from('messages').getPublicUrl(data.path);
        content = publicUrl;
      }
    } else {
      const body = await c.req.json();
      content = body.content;
      type = body.type || 'text';
    }

    if (!content && type === 'text') {
      return c.json({ error: 'Content required' }, 400);
    }

    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      chatId,
      senderId: user.id,
      content,
      type,
      createdAt: new Date().toISOString(),
      edited: false,
      editedAt: null,
    };

    await kv.set(`message:${chatId}:${messageId}`, message);
    
    // Update chat last activity
    const chat = await kv.get(`chat:${chatId}`);
    if (chat) {
      chat.lastMessage = {
        content: type === 'text' ? content : `[${type.toUpperCase()}]`,
        senderId: user.id,
        createdAt: message.createdAt,
      };
      chat.lastActivity = new Date().toISOString();
      await kv.set(`chat:${chatId}`, chat);
    }

    return c.json(message);
  } catch (error) {
    console.log('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Delete message
app.delete('/make-server-45c69d7e/chats/:chatId/messages/:messageId', async (c) => {
  try {
    const user = await getUserFromToken(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const chatId = c.req.param('chatId');
    const messageId = c.req.param('messageId');

    // Check if user is participant
    const userChat = await kv.get(`user_chat:${user.id}:${chatId}`);
    if (!userChat) {
      return c.json({ error: 'Access denied' }, 403);
    }

    const message = await kv.get(`message:${chatId}:${messageId}`);
    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    if (message.senderId !== user.id) {
      return c.json({ error: 'Can only delete own messages' }, 403);
    }

    await kv.del(`message:${chatId}:${messageId}`);

    // Optional: Update last message if this was the last one
    const messages = await kv.getByPrefix(`message:${chatId}:`);
    if (messages.length > 0) {
      const lastMessage = messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      const chat = await kv.get(`chat:${chatId}`);
      if (chat) {
        chat.lastMessage = {
          content: lastMessage.type === 'text' ? lastMessage.content : `[${lastMessage.type.toUpperCase()}]`,
          senderId: lastMessage.senderId,
          createdAt: lastMessage.createdAt,
        };
        chat.lastActivity = lastMessage.createdAt;
        await kv.set(`chat:${chatId}`, chat);
      }
    } else {
      const chat = await kv.get(`chat:${chatId}`);
      if (chat) {
        chat.lastMessage = null;
        chat.lastActivity = chat.createdAt;
        await kv.set(`chat:${chatId}`, chat);
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting message:', error);
    return c.json({ error: 'Failed to delete message' }, 500);
  }
});

// Health check
app.get('/make-server-45c69d7e/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
Deno.serve(app.fetch);