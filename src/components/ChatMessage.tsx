import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Product, ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
  onProductSelect?: (product: Product) => void;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, onProductSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${message.isBot ? 'justify-start' : 'justify-end'} mb-4`}
    >
      <div className={`max-w-[80%] ${message.isBot ? 'order-1' : 'order-2'}`}>
        {message.isBot && (
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-2">
              <span className="text-white text-sm font-bold">🤖</span>
            </div>
            <span className="text-sm text-gray-500">VendorGPT</span>
          </div>
        )}
        
        <div
          className={`rounded-lg p-3 ${
            message.isBot
              ? 'bg-gray-100 text-gray-800'
              : 'bg-green-500 text-white'
          }`}
        >
          <div className="whitespace-pre-wrap text-sm">{message.message}</div>
        </div>

        {/* Product Cards */}
        {message.products && message.products.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.products.map((product) => (
              <Card key={product.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-3">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.setAttribute('style', 'display: flex');
                        }}
                      />
                    ) : null}
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-lg" style={product.imageUrl ? {display: 'none'} : {}}>
                      🥬
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{product.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{product.wholesalerName}</p>
                      <p className="text-xs text-green-600 font-medium">
                        ₹{product.price}/unit • Min: {product.minOrder}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{product.city}</p>
                      <p className="text-xs text-blue-600">Stock: {product.quantity}</p>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => onProductSelect?.(product)}
                      className="text-xs px-2 py-1"
                    >
                      View
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <div className="text-xs text-gray-400 mt-1">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
