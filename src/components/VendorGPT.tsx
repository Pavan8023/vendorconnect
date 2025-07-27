// src/components/VendorGPT.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, MessageCircle, X, Mic, MicOff, Bot, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ChatMessage from './ChatMessage';
import VendorGPT from '../lib/vendorGPT';
import { toast } from 'sonner';
import { Product, ChatMessage as ChatMessageType } from '../types';

interface UserLocation {
  pincode?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  isManual?: boolean;
  detectedAt?: string;
  updatedAt?: string;
}

interface VendorGPTProps {
  onProductSelect?: (product: Product) => void;
  userLocation?: string; // Keep for backward compatibility
}

const VendorGPTComponent: React.FC<VendorGPTProps> = ({ onProductSelect, userLocation: propUserLocation }) => {
  const [user] = useAuthState(auth);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentUserLocation, setCurrentUserLocation] = useState<UserLocation | null>(null);
  const [locationString, setLocationString] = useState<string>('Unknown');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const vendorGPTRef = useRef<VendorGPT | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize VendorGPT
  useEffect(() => {
    vendorGPTRef.current = new VendorGPT();
  }, []);

  // Fetch user location from Firestore
  useEffect(() => {
    const fetchUserLocation = async () => {
      if (!user) return;

      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.location) {
            setCurrentUserLocation(userData.location);
            
            // Create a readable location string
            const location = userData.location as UserLocation;
            let locationStr = 'Unknown';
            
            if (location.city && location.state) {
              locationStr = `${location.city}, ${location.state}`;
              if (location.pincode) {
                locationStr += ` (${location.pincode})`;
              }
            } else if (location.city) {
              locationStr = location.city;
            } else if (location.address) {
              locationStr = location.address;
            }
            
            setLocationString(locationStr);
            console.log('VendorGPT: User location loaded:', locationStr);
          } else {
            // Use prop location as fallback
            setLocationString(propUserLocation || 'Unknown');
          }
        }
      } catch (error) {
        console.error('Error fetching user location:', error);
        // Use prop location as fallback
        setLocationString(propUserLocation || 'Unknown');
      }
    };

    fetchUserLocation();
  }, [user, propUserLocation]);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        toast.error('Voice recognition failed. Please try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Welcome message with location info
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: ChatMessageType = {
        id: 'welcome',
        message: `Hello! 👋 I'm VendorGPT, your AI-powered procurement assistant.

${locationString !== 'Unknown' ? `📍 **Your Location:** ${locationString}\n` : ''}
I can help you:
• **Find fresh produce** from verified suppliers${locationString !== 'Unknown' ? ' near you' : ''}
• **Compare prices** across multiple vendors
• **Create bid requests** when products aren't available
• **Connect with nearby suppliers** instantly

Just tell me what you need! For example:
- "I need 10kg onions within ₹300"
- "Show me tomato suppliers near me"
- "Create a bid for 50kg potatoes"${locationString !== 'Unknown' ? `\n- "Find vegetables suppliers in ${currentUserLocation?.city || 'my area'}"` : ''}`,
        isBot: true,
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length, locationString, currentUserLocation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !vendorGPTRef.current || !user) return;

    const userMessage: ChatMessageType = {
      id: `user_${Date.now()}`,
      message: inputMessage,
      isBot: false,
      timestamp: new Date()
    };

    const currentInput = inputMessage;
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Pass the detected location and full location object to VendorGPT
      const botResponse = await vendorGPTRef.current.processMessage(
        currentInput,
        locationString,
        user.uid,
        user.displayName || 'User',
        user.email || '',
      );

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Something went wrong. Please try again.');

      // Add error message
      const errorMessage: ChatMessageType = {
        id: `error_${Date.now()}`,
        message: "Sorry, I encountered an error. Please try again.",
        isBot: true,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('Voice input not supported on this device.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg border-0 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          {isOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <>
              <MessageCircle className="h-6 w-6 text-white" />
              <Sparkles className="absolute top-1 right-1 h-3 w-3 text-yellow-300 animate-pulse" />
            </>
          )}
        </Button>
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 w-96 h-[600px] z-40"
          >
            <Card className="h-full flex flex-col shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/20 rounded-full">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span>VendorGPT</span>
                      {locationString !== 'Unknown' && (
                        <span className="text-xs font-normal opacity-90">
                          📍 {locationString}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse" />
                    <span className="text-sm font-normal">Online</span>
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      onProductSelect={onProductSelect}
                    />
                  ))}

                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white rounded-2xl p-4 shadow-sm">
                        <div className="flex space-x-1.5">
                          <motion.div
                            className="w-2.5 h-2.5 bg-green-500 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          />
                          <motion.div
                            className="w-2.5 h-2.5 bg-green-500 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          />
                          <motion.div
                            className="w-2.5 h-2.5 bg-green-500 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t bg-white p-4">
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Ask me anything..."
                        disabled={isLoading}
                        className="pr-10 bg-gray-50 border-gray-200 focus:border-green-400 focus:ring-green-400"
                      />
                    </div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleVoiceInput}
                        variant="outline"
                        size="icon"
                        className={`${
                          isListening
                            ? 'bg-red-50 border-red-300 hover:bg-red-100'
                            : 'hover:bg-gray-50 border-gray-200'
                        } transition-colors`}
                        disabled={isLoading}
                      >
                        {isListening ? (
                          <MicOff className="h-4 w-4 text-red-500" />
                        ) : (
                          <Mic className="h-4 w-4 text-gray-600" />
                        )}
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-center gap-4 text-xs text-gray-500 mt-3">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px]">Enter</kbd>
                      to send
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Mic className="h-3 w-3" />
                      Voice input
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      💰 Create bids
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VendorGPTComponent;
