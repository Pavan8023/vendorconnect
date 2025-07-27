import { Star, MapPin, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
}

interface SupplierCardProps {
  supplier: Supplier;
  onViewDetails: (supplierId: number) => void;
}

export const SupplierCard = ({ supplier, onViewDetails }: SupplierCardProps) => {
  return (
    <Card className="h-full hover:shadow-card transition-all duration-300 hover:scale-[1.02] bg-card animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-lg text-card-foreground">{supplier.name}</h3>
            <div className="flex items-center text-muted-foreground text-sm">
              <MapPin className="h-3 w-3 mr-1" />
              {supplier.location}
            </div>
          </div>
          <div className="flex items-center space-x-1 bg-accent/10 px-2 py-1 rounded-full">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-sm font-medium text-accent">{supplier.rating}</span>
            <span className="text-xs text-muted-foreground">({supplier.reviews})</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {supplier.description}
        </p>

        <div className="flex flex-wrap gap-1">
          {supplier.specialties.slice(0, 3).map((specialty) => (
            <Badge key={specialty} variant="secondary" className="text-xs">
              {specialty}
            </Badge>
          ))}
          {supplier.specialties.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{supplier.specialties.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-muted-foreground">
            <Clock className="h-3 w-3 mr-1" />
            {supplier.deliveryTime}
          </div>
          <div className="text-muted-foreground">
            Min: ₹{supplier.minOrder}
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => window.open(`tel:${supplier.phone}`, '_self')}
        >
          <Phone className="h-3 w-3 mr-1" />
          Call
        </Button>
        <Button
          variant="warm"
          size="sm"
          className="flex-1"
          onClick={() => onViewDetails(supplier.id)}
        >
          View Products
        </Button>
      </CardFooter>
    </Card>
  );
};