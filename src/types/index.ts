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

export interface Bid {
  id: string;
  vendorId: string;
  productType: string;
  quantity: number;
  unit: string;
  offeredPrice: number;
  city: string;
  status: "open" | "accepted" | "expired" | "cancelled";
  acceptedBy?: string;
  createdAt: Date;
  acceptedAt?: Date;
}
