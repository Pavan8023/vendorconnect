// src/components/MyOrdersModal.tsx
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, RefreshCw, Package, Clock } from 'lucide-react';
import type { Order } from '@/types';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  onRefresh: () => Promise<void>;
}

const MyOrdersModal = ({ isOpen, onClose, orders, onRefresh }: MyOrdersModalProps) => {
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
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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
              <p className="text-gray-500 mt-1">Your orders from accepted bids will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className={`border-l-4 ${
                  order.status === 'confirmed' ? 'border-l-blue-500' :
                  order.status === 'shipped' ? 'border-l-yellow-500' :
                  order.status === 'delivered' ? 'border-l-green-500' :
                  'border-l-gray-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-lg">{order.productName}</h4>
                      <Badge variant={getOrderStatusColor(order.status)}>
                        {order.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div>
                        <span className="font-medium">Order ID:</span> #{order.id.slice(-8)}
                      </div>
                      <div>
                        <span className="font-medium">Wholesaler:</span> {order.wholesalerName}
                      </div>
                      <div>
                        <span className="font-medium">Quantity:</span> {order.quantity} units
                      </div>
                      <div>
                        <span className="font-medium">Price per unit:</span> ₹{order.pricePerUnit}
                      </div>
                      <div>
                        <span className="font-medium">Total Amount:</span> ₹{order.totalAmount}
                      </div>
                      <div>
                        <span className="font-medium">Status:</span> {order.status}
                      </div>
                    </div>

                    <div className="text-sm text-gray-500 mb-3">
                      <span className="font-medium">Delivery Address:</span> {order.deliveryAddress}
                    </div>

                    {order.estimatedDelivery && (
                      <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                        <Clock className="h-4 w-4" />
                        <span>Estimated Delivery: {order.estimatedDelivery.toLocaleString()}</span>
                      </div>
                    )}

                    {order.status === 'confirmed' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h5 className="font-medium text-blue-800">📦 Order Confirmed!</h5>
                        <p className="text-sm text-blue-700">
                          Your order has been confirmed by the wholesaler. It will be shipped soon.
                        </p>
                      </div>
                    )}

                    {order.status === 'shipped' && (
                      <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                        <h5 className="font-medium text-yellow-800">🚚 Order Shipped!</h5>
                        <p className="text-sm text-yellow-700">
                          Your order is on the way. Expected delivery: {order.estimatedDelivery?.toLocaleTimeString()}
                        </p>
                      </div>
                    )}

                    {order.status === 'delivered' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <h5 className="font-medium text-green-800">✅ Order Delivered!</h5>
                        <p className="text-sm text-green-700">
                          Your order has been delivered successfully. Enjoy your fresh produce!
                        </p>
                      </div>
                    )}

                    {order.status === 'cancelled' && (
                      <div className="mt-4 p-3 bg-red-50 rounded-lg">
                        <h5 className="font-medium text-red-800">❌ Order Cancelled</h5>
                        <p className="text-sm text-red-700">
                          This order was cancelled. You can create a new bid request if needed.
                        </p>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-3">
                      Order Created: {order.createdAt.toLocaleString()}
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

export default MyOrdersModal;
