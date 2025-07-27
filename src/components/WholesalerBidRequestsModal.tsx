// src/components/WholesalerBidRequestsModal.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, RefreshCw, Package } from 'lucide-react';
import type { BidRequest } from '@/types';

interface WholesalerBidRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bidRequests: BidRequest[];
  onRefresh: () => Promise<void>;
  onAcceptBid: (bidRequest: BidRequest) => Promise<void>;
  onRejectBid: (bidId: string) => Promise<void>;
}

const WholesalerBidRequestsModal = ({ 
  isOpen, 
  onClose, 
  bidRequests, 
  onRefresh,
  onAcceptBid,
  onRejectBid
}: WholesalerBidRequestsModalProps) => {
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

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate':
        return 'destructive';
      case 'today':
        return 'default';
      case 'tomorrow':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-4 flex justify-between items-center border-b">
          <div className="flex items-center space-x-3">
            <h3 className="text-xl font-bold">Bid Requests (Pending)</h3>
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
              <h3 className="text-lg font-medium text-gray-700">No pending bid requests</h3>
              <p className="text-gray-500 mt-1">New requests will appear here when vendors make bids</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bidRequests.map((request) => (
                <Card key={request.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{request.productName}</CardTitle>
                      <Badge variant={getUrgencyColor(request.urgency)}>
                        {formatUrgency(request.urgency)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Vendor:</span>
                        <span className="text-sm">{request.vendorName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Quantity:</span>
                        <span className="text-sm">{request.quantity} units</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Bid Price:</span>
                        <span className="text-lg font-bold text-green-600">₹{request.bidPrice}/unit</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Total Value:</span>
                        <span className="text-lg font-bold text-blue-600">₹{request.bidPrice * request.quantity}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Location:</span>
                        <span className="text-sm">{request.location}</span>
                      </div>
                      
                      <div className="text-sm text-gray-500">
                        <span className="font-medium">Description:</span> {request.description}
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        Requested: {request.createdAt.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => onAcceptBid(request)}
                      >
                        <Package className="h-4 w-4 mr-2" />
                        Create Order (₹{request.bidPrice * request.quantity})
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => onRejectBid(request.id)}
                      >
                        Reject
                      </Button>
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

export default WholesalerBidRequestsModal;
