// src/components/ChatMessage.tsx
import React from 'react';
import { ChatMessage as ChatMessageType, Product } from '../types';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
  onProductSelect?: (product: Product) => void;
}

const parseMarkdown = (text: string): React.ReactNode => {
  // Split by markdown patterns while preserving the delimiters
  const segments = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
  
  return segments.map((segment, index) => {
    // Bold text **text**
    if (segment.startsWith('**') && segment.endsWith('**')) {
      const boldText = segment.slice(2, -2);
      return <strong key={index} className="font-bold text-gray-900">{boldText}</strong>;
    }
    
    // Italic text *text*
    if (segment.startsWith('*') && segment.endsWith('*') && !segment.startsWith('**')) {
      const italicText = segment.slice(1, -1);
      return <em key={index} className="italic">{italicText}</em>;
    }
    
    // Code text `text`
    if (segment.startsWith('`') && segment.endsWith('`')) {
      const codeText = segment.slice(1, -1);
      return <code key={index} className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{codeText}</code>;
    }
    
    return segment;
  });
};

const formatMessageText = (text: string): React.ReactNode => {
  // Split by line breaks and process each line
  const lines = text.split('\n');
  
  return lines.map((line, lineIndex) => {
    // Handle bullet points
    if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
      const bulletText = line.replace(/^[\s]*[•-]\s*/, '');
      return (
        <div key={lineIndex} className="flex items-start gap-2 my-1">
          <span className="text-green-600 mt-1 text-sm">•</span>
          <span className="flex-1">{parseMarkdown(bulletText)}</span>
        </div>
      );
    }
    
    // Handle numbered lists
    const numberedMatch = line.match(/^(\d+\.)\s(.*)$/);
    if (numberedMatch) {
      return (
        <div key={lineIndex} className="flex items-start gap-2 my-1">
          <span className="text-green-600 font-medium text-sm">{numberedMatch[1]}</span>
          <span className="flex-1">{parseMarkdown(numberedMatch[2])}</span>
        </div>
      );
    }
    
    // Regular line
    if (line.trim()) {
      return (
        <div key={lineIndex} className="my-1">
          {parseMarkdown(line)}
        </div>
      );
    }
    
    // Empty line
    return <br key={lineIndex} />;
  });
};

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onProductSelect }) => {
  const isBot = message.isBot;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div className={`flex items-start gap-3 max-w-[85%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isBot 
            ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
            : 'bg-gradient-to-r from-blue-500 to-purple-600'
        }`}>
          {isBot ? (
            <Bot className="h-4 w-4 text-white" />
          ) : (
            <User className="h-4 w-4 text-white" />
          )}
        </div>

        {/* Message Bubble */}
        <div className={`rounded-2xl px-4 py-3 shadow-sm ${
          isBot
            ? 'bg-white border border-gray-100'
            : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
        }`}>
          <div className={`text-sm leading-relaxed ${
            isBot ? 'text-gray-800' : 'text-white'
          }`}>
            {formatMessageText(message.message)}
          </div>

          {/* Products Grid */}
          {message.products && message.products.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="text-xs font-medium text-gray-600 border-t pt-3">
                Available Products:
              </div>
              <div className="grid gap-3">
                {message.products.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-gray-50 rounded-lg p-3 border cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => onProductSelect?.(product)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{product.name}</div>
                        <div className="text-xs text-gray-600">{product.wholesalerName}</div>
                        <div className="text-xs text-gray-500">{product.city}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">₹{product.price}/unit</div>
                        <div className="text-xs text-gray-500">{product.quantity} available</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs mt-2 ${
            isBot ? 'text-gray-400' : 'text-white/70'
          }`}>
            {message.timestamp.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
