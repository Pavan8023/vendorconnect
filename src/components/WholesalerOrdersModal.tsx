// src/components/WholesalerOrdersModal.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, RefreshCw, Package, Clock } from 'lucide-react';
import type { Order } from '@/types';

interface WholesalerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onRefresh: () => Promise<void>;
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => Promise<void>;
}

const WholesalerOrdersModal = ({ 
  isOpen, 
  onClose, 
  orders, 
  onRefresh,
  onUpdateOrderStatus
}: WholesalerOrdersModalProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };

  const getOrderStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'confirmed':
        return 'default';
      case 'shipped':
        return 'secondary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'destructive';
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
            <h3 className="text-xl font-bold">My Orders</h3>
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
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-4">
                <Package className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-700">No orders yet</h3>
              <p className="text-gray-500 mt-1">Orders from accepted bids will appear here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {orders.map((order) => (
                <Card key={order.id} className={`border-l-4 ${
                  order.status === 'confirmed' ? 'border-l-blue-500' :
                  order.status === 'shipped' ? 'border-l-yellow-500' :
                  order.status === 'delivered' ? 'border-l-green-500' :
                  'border-l-gray-500'
                }`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{order.productName}</CardTitle>
                      <Badge variant={getOrderStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Order ID:</span>
                        <span className="text-sm font-mono">{order.id.slice(-8)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Vendor:</span>
                        <span className="text-sm">{order.vendorName}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Quantity:</span>
                        <span className="text-sm">{order.quantity} units</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Price per unit:</span>
                        <span className="text-sm">₹{order.pricePerUnit}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Total Amount:</span>
                        <span className="text-lg font-bold text-green-600">₹{order.totalAmount}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Delivery Address:</span>
                        <span className="text-sm">{order.deliveryAddress}</span>
                      </div>

                      {order.estimatedDelivery && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">Est. Delivery: {order.estimatedDelivery.toLocaleString()}</span>
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-400">
                        Created: {order.createdAt.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      {order.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={() => onUpdateOrderStatus(order.id, 'shipped')}
                          className="flex-1"
                        >
                          Mark as Shipped
                        </Button>
                      )}
                      
                      {order.status === 'shipped' && (
                        <Button
                          size="sm"
                          onClick={() => onUpdateOrderStatus(order.id, 'delivered')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          Mark as Delivered
                        </Button>
                      )}

                      {(order.status === 'confirmed' || order.status === 'shipped') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateOrderStatus(order.id, 'cancelled')}
                          className="flex-1"
                        >
                          Cancel Order
                        </Button>
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

export default WholesalerOrdersModal;
