import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useAuth } from '../auth/auth-context';
import { 
  Phone, 
  Video, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOff,
  Clock,
  Calendar,
  Users
} from 'lucide-react';

interface CallRecord {
  id: string;
  type: 'audio' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  participants: {
    id: string;
    name: string;
    avatar?: string;
  }[];
  duration?: number;
  startTime: string;
  endTime?: string;
  chatId?: string;
}

export function CallManager() {
  const { user } = useAuth();
  const [callHistory, setCallHistory] = useState<CallRecord[]>([]);
  const [activeTab, setActiveTab] = useState('history');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      // Mock data for demonstration
      const mockCalls: CallRecord[] = [
        {
          id: '1',
          type: 'video',
          direction: 'outgoing',
          participants: [
            { id: '2', name: 'Анна Иванова', avatar: '' }
          ],
          duration: 1245, // seconds
          startTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          endTime: new Date(Date.now() - 2 * 60 * 60 * 1000 + 1245 * 1000).toISOString(),
        },
        {
          id: '2',
          type: 'audio',
          direction: 'incoming',
          participants: [
            { id: '3', name: 'Михаил Петров', avatar: '' }
          ],
          duration: 567,
          startTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
          endTime: new Date(Date.now() - 5 * 60 * 60 * 1000 + 567 * 1000).toISOString(),
        },
        {
          id: '3',
          type: 'audio',
          direction: 'missed',
          participants: [
            { id: '4', name: 'Елена Сидорова', avatar: '' }
          ],
          startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), // 8 hours ago
        },
        {
          id: '4',
          type: 'video',
          direction: 'outgoing',
          participants: [
            { id: '5', name: 'Групповой чат', avatar: '' },
            { id: '6', name: 'Дмитрий Козлов', avatar: '' },
            { id: '7', name: 'Ольга Морозова', avatar: '' }
          ],
          duration: 2456,
          startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
          endTime: new Date(Date.now() - 24 * 60 * 60 * 1000 + 2456 * 1000).toISOString(),
        },
      ];

      setCallHistory(mockCalls);
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Только что';
    } else if (diffInHours < 24) {
      return `${diffInHours} ч. назад`;
    } else if (diffInHours < 48) {
      return 'Вчера';
    } else {
      return date.toLocaleDateString('ru-RU');
    }
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.direction === 'missed') {
      return <PhoneOff className="h-4 w-4 text-destructive" />;
    } else if (call.direction === 'incoming') {
      return <PhoneIncoming className="h-4 w-4 text-green-500" />;
    } else {
      return <PhoneCall className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCallTypeIcon = (type: 'audio' | 'video') => {
    return type === 'video' ? 
      <Video className="h-4 w-4" /> : 
      <Phone className="h-4 w-4" />;
  };

  const getParticipantNames = (participants: CallRecord['participants']) => {
    if (participants.length === 1) {
      return participants[0].name;
    } else if (participants.length === 2) {
      return `${participants[0].name}, ${participants[1].name}`;
    } else {
      return `${participants[0].name} и еще ${participants.length - 1}`;
    }
  };

  const startCall = async (type: 'audio' | 'video', participantId: string) => {
    // This would initiate a call
    console.log(`Starting ${type} call with ${participantId}`);
  };

  const groupedCalls = callHistory.reduce((groups, call) => {
    const date = new Date(call.startTime).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(call);
    return groups;
  }, {} as Record<string, CallRecord[]>);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p>Загрузка истории звонков...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div>
        <h1>Звонки</h1>
        <p className="text-muted-foreground">
          История звонков и управление вызовами
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Phone className="h-6 w-6" />
              <span>Аудиозвонок</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Video className="h-6 w-6" />
              <span>Видеозвонок</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Users className="h-6 w-6" />
              <span>Групповой звонок</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Calendar className="h-6 w-6" />
              <span>Запланировать</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">История</TabsTrigger>
          <TabsTrigger value="scheduled">Запланированные</TabsTrigger>
          <TabsTrigger value="settings">Настройки</TabsTrigger>
        </TabsList>

        {/* Call History */}
        <TabsContent value="history" className="space-y-4">
          <ScrollArea className="h-96">
            {Object.keys(groupedCalls).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3>Нет истории звонков</h3>
                <p>Совершите первый звонок, чтобы увидеть историю</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedCalls).map(([date, calls]) => (
                  <div key={date}>
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {new Date(date).toLocaleDateString('ru-RU', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {calls.map(call => (
                        <motion.div
                          key={call.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                              {getCallIcon(call)}
                              {getCallTypeIcon(call.type)}
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              {call.participants.length === 1 ? (
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={call.participants[0].avatar} />
                                  <AvatarFallback>
                                    {call.participants[0].name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              ) : (
                                <div className="relative">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback>
                                      <Users className="h-5 w-5" />
                                    </AvatarFallback>
                                  </Avatar>
                                  <Badge className="absolute -top-2 -right-2 text-xs">
                                    {call.participants.length}
                                  </Badge>
                                </div>
                              )}
                              
                              <div>
                                <p>{getParticipantNames(call.participants)}</p>
                                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                  <span>{formatTime(call.startTime)}</span>
                                  {call.duration && (
                                    <>
                                      <span>•</span>
                                      <div className="flex items-center space-x-1">
                                        <Clock className="h-3 w-3" />
                                        <span>{formatDuration(call.duration)}</span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startCall('audio', call.participants[0].id)}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => startCall('video', call.participants[0].id)}
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        {/* Scheduled Calls */}
        <TabsContent value="scheduled" className="space-y-4">
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3>Нет запланированных звонков</h3>
            <p>Запланируйте звонок, чтобы не забыть важную встречу</p>
            <Button className="mt-4">
              <Calendar className="h-4 w-4 mr-2" />
              Запланировать звонок
            </Button>
          </div>
        </TabsContent>

        {/* Settings */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Настройки звонков</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <h4>Аудио</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Микрофон</label>
                    <select className="w-full mt-1 p-2 border border-border rounded-md bg-background">
                      <option>По умолчанию - Встроенный микрофон</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm">Динамики</label>
                    <select className="w-full mt-1 p-2 border border-border rounded-md bg-background">
                      <option>По умолчанию - Встроенные динамики</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4>Видео</h4>
                <div>
                  <label className="text-sm">Камера</label>
                  <select className="w-full mt-1 p-2 border border-border rounded-md bg-background">
                    <option>По умолчанию - Встроенная камера</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}