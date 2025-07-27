import { SlidersHorizontal, MapPin, Star, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  selectedCity: string;
  selectedRating: string;
  selectedPriceRange: string;
  onCityChange: (city: string) => void;
  onRatingChange: (rating: string) => void;
  onPriceRangeChange: (range: string) => void;
  onClearFilters: () => void;
  activeFiltersCount: number;
}

const cities = ["All Cities", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Kolkata"];
const ratings = ["All Ratings", "4.5+ Stars", "4.0+ Stars", "3.5+ Stars"];
const priceRanges = ["All Prices", "₹0-500", "₹500-1000", "₹1000+"];

export const FilterBar = ({
  selectedCity,
  selectedRating,
  selectedPriceRange,
  onCityChange,
  onRatingChange,
  onPriceRangeChange,
  onClearFilters,
  activeFiltersCount
}: FilterBarProps) => {
  return (
    <div className="bg-card border rounded-lg p-4 space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-foreground">Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeFiltersCount} active
            </Badge>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* City Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <MapPin className="h-3 w-3 mr-1" />
            Location
          </label>
          <Select value={selectedCity} onValueChange={onCityChange}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select city" />
            </SelectTrigger>
            <SelectContent>
              {cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Rating Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <Star className="h-3 w-3 mr-1" />
            Rating
          </label>
          <Select value={selectedRating} onValueChange={onRatingChange}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select rating" />
            </SelectTrigger>
            <SelectContent>
              {ratings.map((rating) => (
                <SelectItem key={rating} value={rating}>
                  {rating}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center">
            <IndianRupee className="h-3 w-3 mr-1" />
            Min Order
          </label>
          <Select value={selectedPriceRange} onValueChange={onPriceRangeChange}>
            <SelectTrigger className="bg-background/50">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {priceRanges.map((range) => (
                <SelectItem key={range} value={range}>
                  {range}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};