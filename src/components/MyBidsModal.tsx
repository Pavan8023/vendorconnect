// src/components/MyBidsModal.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, RefreshCw } from 'lucide-react';
import type { BidRequest } from '@/types';

interface MyBidsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidRequests: BidRequest[];
  onRefresh: () => Promise<void>;
}

const MyBidsModal = ({ isOpen, onClose, bidRequests, onRefresh }: MyBidsModalProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatUrgency = (urgency: string) => {
    const urgencyMap: { [key: string]: string } = {
      'immediate': 'Immediate',
      'today': 'Today',
      'tomorrow': 'Tomorrow',
      'this_week': 'This Week'
    };
    return urgencyMap[urgency] || urgency;
  };

  const getBidStatusColor = (status: string) => {
    switch (status) {
      case 'order_placed':
        return 'success';
      case 'accepted':
        return 'default';
      case 'rejected':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 flex justify-between items-center border-b">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold">My Bid Requests</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="text-gray-500 hover:text-gray-700"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-6">
          {bidRequests.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700">No bid requests yet</h3>
              <p className="text-gray-500 mt-1">Use VendorGPT to create bid requests when products aren't available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bidRequests.map((request) => (
                <Card key={request.id} className={`border-l-4 ${
                  request.status === 'order_placed' ? 'border-l-green-500' :
                  request.status === 'accepted' ? 'border-l-blue-500' :
                  request.status === 'rejected' ? 'border-l-red-500' :
                  'border-l-yellow-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg">{request.productName}</h4>
                      <Badge variant={getBidStatusColor(request.status)}>
                        {request.status === 'order_placed' ? 'ORDER PLACED' : 
                         request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-medium">Quantity:</span> {request.quantity} units
                      </div>
                      <div>
                        <span className="font-medium">Bid Price:</span> ₹{request.bidPrice}/unit
                      </div>
                      <div>
                        <span className="font-medium">Total Value:</span> ₹{request.bidPrice * request.quantity}
                      </div>
                      <div>
                        <span className="font-medium">Urgency:</span> {formatUrgency(request.urgency)}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-3">
                      <span className="font-medium">Description:</span> {request.description}
                    </div>
                    
                    {request.status === 'accepted' && request.wholesalerName && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-800">✅ Bid Accepted!</h5>
                        <p className="text-sm text-blue-700">
                          Accepted by: {request.wholesalerName}
                        </p>
                        {request.wholesalerContact && (
                          <p className="text-sm text-blue-700">
                            Contact: {request.wholesalerContact}
                          </p>
                        )}
                      </div>
                    )}

                    {request.status === 'order_placed' && request.orderId && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-800">🎉 Order Created!</h5>
                        <p className="text-sm text-green-700">
                          Your bid was accepted and an order has been created!
                        </p>
                        <p className="text-sm text-green-700">
                          Order ID: #{request.orderId.slice(-8)}
                        </p>
                        <p className="text-sm text-green-700">
                          Check "My Orders" section for delivery tracking.
                        </p>
                      </div>
                    )}

                    {request.status === 'rejected' && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <h5 className="font-medium text-red-800">❌ Bid Rejected</h5>
                        <p className="text-sm text-red-700">
                          This bid request was not accepted. You can create a new bid with different terms.
                        </p>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <h5 className="font-medium text-yellow-800">⏳ Bid Pending</h5>
                        <p className="text-sm text-yellow-700">
                          Your bid is waiting for wholesaler response. You'll be notified when someone accepts.
                        </p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-3">
                      Created: {request.createdAt.toLocaleString()}
                      {request.acceptedAt && (
                        <span> • Accepted: {request.acceptedAt.toLocaleString()}</span>
                      )}
                      {request.orderPlacedAt && (
                        <span> • Order Placed: {request.orderPlacedAt.toLocaleString()}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyBidsModal;
