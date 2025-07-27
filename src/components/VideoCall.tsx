// src/components/VideoCall.tsx
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface VideoCallProps {
  roomName: string;
  onClose: () => void;
  userInfo: {
    displayName: string;
    email: string;
  };
}

const VideoCall = ({ roomName, onClose, userInfo }: VideoCallProps) => {
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-gray-900">
        <h2 className="text-white font-bold">Video Verification</h2>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-white hover:bg-gray-800"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      
      <div className="flex-grow">
        <JitsiMeeting
          roomName={roomName}
          configOverwrite={{
            startWithAudioMuted: true,
            disableModeratorIndicator: true,
            startScreenSharing: true,
            enableEmailInStats: false,
            toolbarButtons: ['microphone', 'camera', 'hangup', 'desktop'],
          }}
          interfaceConfigOverwrite={{
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
            SHOW_CHROME_EXTENSION_BANNER: false,
          }}
          userInfo={{
            displayName: userInfo.displayName,
            email: userInfo.email,
          }}
          getIFrameRef={(iframe) => {
            iframe.style.height = '100%';
            iframe.style.width = '100%';
          }}
        />
      </div>
    </div>
  );
};

export default VideoCall;