import { useState } from "react";
import { ArrowLeft, Star, MapPin, Clock, Phone, Mail, ShoppingCart, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  unit: string;
  image: string;
  inStock: boolean;
  quality: string;
}

interface Supplier {
  id: number;
  name: string;
  location: string;
  city: string;
  rating: number;
  reviews: number;
  phone: string;
  email: string;
  description: string;
  specialties: string[];
  deliveryTime: string;
  minOrder: number;
  products: Product[];
}

interface SupplierProfileProps {
  supplier: Supplier;
  onBack: () => void;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export const SupplierProfile = ({ supplier, onBack }: SupplierProfileProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();

  const addToCart = (product: Product, quantity: number) => {
    if (quantity <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    
    toast({
      title: "Added to cart",
      description: `${quantity} ${product.unit} of ${product.name} added`,
    });
  };

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getCartQuantity = (productId: number) => {
    return cart.find(item => item.product.id === productId)?.quantity || 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{supplier.name}</h1>
          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 mr-1" />
            {supplier.location}
          </div>
        </div>
      </div>

      {/* Supplier Info */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-medium">{supplier.rating}</span>
                  <span className="text-muted-foreground">({supplier.reviews} reviews)</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  {supplier.deliveryTime}
                </div>
              </div>
              
              <p className="text-muted-foreground">{supplier.description}</p>
              
              <div className="flex flex-wrap gap-2">
                {supplier.specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary">
                    {specialty}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-foreground">{supplier.phone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-foreground">{supplier.email}</span>
                </div>
              </div>
              
              <div className="p-3 bg-accent/10 rounded-lg">
                <span className="text-sm font-medium text-foreground">Minimum Order: ₹{supplier.minOrder}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Available Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supplier.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              cartQuantity={getCartQuantity(product.id)}
              onAddToCart={addToCart}
              onRemoveFromCart={removeFromCart}
            />
          ))}
        </div>
      </div>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <Card className="sticky bottom-4 bg-card/95 backdrop-blur">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-foreground">
                  {cart.length} items • ₹{getTotalAmount()}
                </span>
                <div className="text-sm text-muted-foreground">
                  {getTotalAmount() >= supplier.minOrder 
                    ? "Ready to order!" 
                    : `Add ₹${supplier.minOrder - getTotalAmount()} more for minimum order`
                  }
                </div>
              </div>
              <Button 
                variant="warm" 
                disabled={getTotalAmount() < supplier.minOrder}
                onClick={() => {
                  toast({
                    title: "Order placed successfully!",
                    description: `Your order of ₹${getTotalAmount()} has been sent to ${supplier.name}`,
                  });
                  setCart([]);
                }}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Place Order
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  cartQuantity: number;
  onAddToCart: (product: Product, quantity: number) => void;
  onRemoveFromCart: (productId: number) => void;
}

const ProductCard = ({ product, cartQuantity, onAddToCart, onRemoveFromCart }: ProductCardProps) => {
  const [quantity, setQuantity] = useState(1);

  return (
    <Card className="hover:shadow-card transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center">
          <div className="text-muted-foreground text-4xl">🥬</div>
        </div>
        <div className="space-y-1">
          <h3 className="font-medium text-foreground">{product.name}</h3>
          <Badge variant="outline" className="text-xs">
            {product.quality}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-foreground">
            ₹{product.price}/{product.unit}
          </span>
          <Badge variant={product.inStock ? "success" : "destructive"}>
            {product.inStock ? "In Stock" : "Out of Stock"}
          </Badge>
        </div>

        {product.inStock && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 text-center"
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <span className="text-sm text-muted-foreground">{product.unit}</span>
            </div>

            {cartQuantity > 0 && (
              <div className="text-sm text-accent">
                {cartQuantity} {product.unit} in cart
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onAddToCart(product, quantity)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
              {cartQuantity > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFromCart(product.id)}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};