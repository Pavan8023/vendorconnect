export interface Product {
  id: string;
  name: string;
  description: string;
  address: string;
  city: string;
  mobileNo: string;
  countryCode: string;
  price: number;
  minOrder: number;
  quantity: number;
  imageUrl: string;
  wholesalerId: string;
  wholesalerName?: string;
  wholesalerPhoto?: string;
}

export interface ChatMessage {
  id: string;
  message: string;
  isBot: boolean;
  timestamp: Date;
  products?: Product[];
}



// src/types/index.ts
export interface BidRequest {
  id: string;
  vendorId: string;
  vendorName: string;
  vendorEmail: string;
  productName: string;
  description: string;
  quantity: number;
  bidPrice: number;
  urgency: 'immediate' | 'today' | 'tomorrow' | 'this_week';
  location: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'order_placed';
  createdAt: Date;
  acceptedBy?: string;
  acceptedAt?: Date;
  wholesalerName?: string;
  wholesalerContact?: string;
  orderId?: string; // New field for order tracking
  orderPlacedAt?: Date; // New field for order timestamp
}

export interface Order {
  id: string;
  bidRequestId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  vendorId: string;
  vendorName: string;
  wholesalerId: string;
  wholesalerName: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
  deliveryAddress?: string;
  estimatedDelivery?: Date;
}
