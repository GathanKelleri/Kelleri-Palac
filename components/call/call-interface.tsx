import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/auth-context';
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  Monitor,
  Volume2,
  VolumeX,
  Users,
  Settings
} from 'lucide-react';

interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  isSpeaking: boolean;
  stream?: MediaStream;
}

interface CallInterfaceProps {
  chatId: string;
  callType: 'audio' | 'video';
  participants: CallParticipant[];
  onEndCall: () => void;
}

export function CallInterface({ chatId, callType, participants, onEndCall }: CallInterfaceProps) {
  const { user } = useAuth();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(callType === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [showParticipants, setShowParticipants] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<{ [key: string]: HTMLVideoElement }>({});
  const peerConnections = useRef<{ [key: string]: RTCPeerConnection }>({});
  const callStartTime = useRef<number>(Date.now());

  // Timer for call duration
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Initialize media stream
  useEffect(() => {
    initializeMedia();
    return () => {
      cleanup();
    };
  }, []);

  const initializeMedia = async () => {
    try {
      const constraints = {
        audio: true,
        video: callType === 'video',
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Initialize WebRTC connections for each participant
      participants.forEach(participant => {
        if (participant.id !== user?.id) {
          createPeerConnection(participant.id, stream);
        }
      });
    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const createPeerConnection = (participantId: string, localStream: MediaStream) => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    // Add local stream tracks
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
    });

    // Handle remote stream
    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      const videoElement = remoteVideoRefs.current[participantId];
      if (videoElement) {
        videoElement.srcObject = remoteStream;
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to remote peer through signaling server
        // This would be implemented with WebSocket or similar
        console.log('ICE candidate:', event.candidate);
      }
    };

    peerConnections.current[participantId] = peerConnection;
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    Object.values(peerConnections.current).forEach(pc => {
      pc.close();
    });
    
    peerConnections.current = {};
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      
      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];
      Object.values(peerConnections.current).forEach(pc => {
        const sender = pc.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
      
      setIsScreenSharing(true);
      
      // Handle screen share end
      videoTrack.onended = () => {
        setIsScreenSharing(false);
        // Switch back to camera
        if (localStream) {
          const cameraTrack = localStream.getVideoTracks()[0];
          Object.values(peerConnections.current).forEach(pc => {
            const sender = pc.getSenders().find(s => 
              s.track && s.track.kind === 'video'
            );
            if (sender && cameraTrack) {
              sender.replaceTrack(cameraTrack);
            }
          });
        }
      };
    } catch (error) {
      console.error('Error starting screen share:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMainParticipant = () => {
    const speakingParticipant = participants.find(p => 
      p.isSpeaking && p.id !== user?.id
    );
    return speakingParticipant || participants.find(p => p.id !== user?.id);
  };

  const mainParticipant = getMainParticipant();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2>
              {participants.length > 2 ? 'Групповой звонок' : 'Звонок'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatDuration(callDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowParticipants(!showParticipants)}
          >
            <Users className="h-4 w-4 mr-2" />
            {participants.length}
          </Button>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Video area */}
        <div className="flex-1 relative bg-card">
          {callType === 'video' && mainParticipant ? (
            <div className="relative w-full h-full">
              {/* Main participant video */}
              <video
                ref={(el) => {
                  if (el && mainParticipant.id) {
                    remoteVideoRefs.current[mainParticipant.id] = el;
                  }
                }}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Participant info overlay */}
              <div className="absolute bottom-4 left-4">
                <div className="flex items-center space-x-2 bg-black/50 rounded-lg p-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={mainParticipant.avatar} />
                    <AvatarFallback>
                      {mainParticipant.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-white">{mainParticipant.name}</span>
                  {mainParticipant.isSpeaking && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  )}
                </div>
              </div>

              {/* Local video (picture-in-picture) */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-muted rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 text-white text-sm">
                  Вы
                </div>
              </div>
            </div>
          ) : (
            /* Audio call UI */
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-6">
                <Avatar className="h-32 w-32 mx-auto">
                  <AvatarImage src={mainParticipant?.avatar} />
                  <AvatarFallback className="text-4xl">
                    {mainParticipant?.name.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl">
                    {mainParticipant?.name || 'Звонок'}
                  </h3>
                  <p className="text-muted-foreground">
                    {formatDuration(callDuration)}
                  </p>
                </div>
                
                {/* Audio visualization */}
                <div className="flex items-center justify-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 rounded-full bg-primary transition-all duration-300 ${
                        mainParticipant?.isSpeaking 
                          ? 'h-8 animate-pulse' 
                          : 'h-2'
                      }`}
                      style={{
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Participants panel */}
        {showParticipants && (
          <motion.div
            initial={{ x: 300 }}
            animate={{ x: 0 }}
            exit={{ x: 300 }}
            className="w-80 border-l border-border bg-card p-4"
          >
            <h3 className="mb-4">Участники ({participants.length})</h3>
            <div className="space-y-3">
              {participants.map(participant => (
                <div key={participant.id} className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback>
                        {participant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {participant.isSpeaking && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p>{participant.name}</p>
                    <div className="flex items-center space-x-2">
                      {!participant.isAudioEnabled && (
                        <MicOff className="h-3 w-3 text-destructive" />
                      )}
                      {!participant.isVideoEnabled && callType === 'video' && (
                        <VideoOff className="h-3 w-3 text-destructive" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Controls */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center justify-center space-x-4">
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="h-14 w-14 rounded-full p-0"
          >
            {isAudioEnabled ? (
              <Mic className="h-6 w-6" />
            ) : (
              <MicOff className="h-6 w-6" />
            )}
          </Button>

          {callType === 'video' && (
            <Button
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              onClick={toggleVideo}
              className="h-14 w-14 rounded-full p-0"
            >
              {isVideoEnabled ? (
                <Video className="h-6 w-6" />
              ) : (
                <VideoOff className="h-6 w-6" />
              )}
            </Button>
          )}

          <Button
            variant="secondary"
            size="lg"
            onClick={startScreenShare}
            className="h-14 w-14 rounded-full p-0"
            disabled={isScreenSharing}
          >
            <Monitor className={`h-6 w-6 ${isScreenSharing ? 'text-primary' : ''}`} />
          </Button>

          <Button
            variant={isMuted ? "destructive" : "secondary"}
            size="lg"
            onClick={() => setIsMuted(!isMuted)}
            className="h-14 w-14 rounded-full p-0"
          >
            {isMuted ? (
              <VolumeX className="h-6 w-6" />
            ) : (
              <Volume2 className="h-6 w-6" />
            )}
          </Button>

          <Button
            variant="destructive"
            size="lg"
            onClick={onEndCall}
            className="h-14 w-14 rounded-full p-0"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}