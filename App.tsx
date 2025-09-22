import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AuthProvider,
  useAuth,
} from "./components/auth/auth-context";
import { ThemeProvider } from "./components/theme/theme-provider";
import { LoginForm } from "./components/auth/login-form";
import { RegisterForm } from "./components/auth/register-form";
import { Sidebar } from "./components/layout/sidebar";
import { NewsFeed } from "./components/feed/news-feed";
import { ChatList } from "./components/chat/chat-list";
import { ChatWindow } from "./components/chat/chat-window";
import { CallInterface } from "./components/call/call-interface";
import { CallManager } from "./components/call/call-manager";
import { FriendsManager } from "./components/friends/friends-manager";
import { ProfileEditor } from "./components/profile/profile-editor";
import { Settings } from "./components/settings/settings";
import { MusicPlayer } from "./components/music/music-player";
import { Skeleton } from "./components/ui/skeleton";
import { Toaster } from "./components/ui/sonner";

function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {isLogin ? (
            <LoginForm
              key="login"
              onSwitchToRegister={() => setIsLogin(false)}
            />
          ) : (
            <RegisterForm
              key="register"
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function MainApp() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("feed");
  const [selectedChatId, setSelectedChatId] =
    useState<string>();
  const [activeCall, setActiveCall] = useState<{
    chatId: string;
    type: "audio" | "video";
    participants: any[];
  } | null>(null);

  const [currentTrack, setCurrentTrack] = useState<{
    id: string;
    title: string;
    artist: string;
    url: string;
    duration: number;
    avatar?: string;
  } | null>(null);

  const [isMusicPlayerVisible, setIsMusicPlayerVisible] =
    useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar skeleton */}
        <div className="w-80 border-r border-border p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" />
          ))}
        </div>

        {/* Main content skeleton */}
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const handleStartCall = (type: "audio" | "video") => {
    if (selectedChatId) {
      // Mock participants data - in real app this would come from the chat
      const mockParticipants = [
        {
          id: user!.id,
          name: user!.name,
          avatar: user!.avatar,
          isAudioEnabled: true,
          isVideoEnabled: type === "video",
          isSpeaking: false,
        },
        {
          id: "mock-user-2",
          name: "Анна Иванова",
          avatar: "",
          isAudioEnabled: true,
          isVideoEnabled: type === "video",
          isSpeaking: true,
        },
      ];

      setActiveCall({
        chatId: selectedChatId,
        type,
        participants: mockParticipants,
      });
    }
  };

  const handleEndCall = () => {
    setActiveCall(null);
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case "feed":
        return (
          <motion.div
            key="feed"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto"
          >
            <NewsFeed />
          </motion.div>
        );

      case "chats":
        return (
          <motion.div
            key="chats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex h-full"
          >
            <div className="w-1/3 border-r border-border">
              <ChatList
                onChatSelect={setSelectedChatId}
                selectedChatId={selectedChatId}
              />
            </div>
            <div className="flex-1">
              {selectedChatId ? (
                <ChatWindow
                  chatId={selectedChatId}
                  onStartCall={handleStartCall}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                  <div>
                    <h3>Выберите чат</h3>
                    <p>
                      Выберите чат из списка или создайте новый
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );

      case "calls":
        return (
          <motion.div
            key="calls"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <CallManager />
          </motion.div>
        );

      case "friends":
        return (
          <motion.div
            key="friends"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <FriendsManager
              onStartChat={(chatId) => {
                setSelectedChatId(chatId);
                setActiveTab("chats");
              }}
            />
          </motion.div>
        );

      case "profile":
        return (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            <ProfileEditor />
          </motion.div>
        );

      case "settings":
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full overflow-y-auto"
          >
            <Settings />
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main content */}
      <main className="flex-1 h-screen overflow-hidden">
        <AnimatePresence mode="wait">
          {renderMainContent()}
        </AnimatePresence>
      </main>

      {/* Call Interface Overlay */}
      <AnimatePresence>
        {activeCall && (
          <CallInterface
            chatId={activeCall.chatId}
            callType={activeCall.type}
            participants={activeCall.participants}
            onEndCall={handleEndCall}
          />
        )}
      </AnimatePresence>

      {/* Music Player */}
      <MusicPlayer
        track={currentTrack || undefined}
        isVisible={isMusicPlayerVisible && !!currentTrack}
        onClose={() => setIsMusicPlayerVisible(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="dark">
          {" "}
          {/* Force dark theme */}
          <MainApp />
          <Toaster />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}