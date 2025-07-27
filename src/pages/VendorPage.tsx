// src/pages/VendorPage.tsx
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, getDocs, query, updateDoc, doc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

import VideoCall from '@/components/VideoCall';
import type { Product } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, X, Phone, Minus, Plus, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import VendorGPTComponent from '@/components/VendorGPT';


interface Order {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  amount: number;
  status: 'pending' | 'success' | 'failed';
  createdAt: Date;
  wholesalerId: string;
  vendorId: string;
}

const cities = ["All Cities", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Kolkata", "Pune", "Kolhapur"];
const priceRanges = ["All Prices", "₹0-500", "₹500-1000", "₹1000+"];
const RAZORPAY_LINK = "https://rzp.io/rzp/mog0llFL";
const MIN_ORDER_QUANTITY = 5; // Fixed minimum order quantity

const VendorPage = () => {
  const [user] = useAuthState(auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<Order | null>(null);
  const [quantity, setQuantity] = useState(MIN_ORDER_QUANTITY);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState('');

  // Filter states
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All Prices");
  const [searchQuery, setSearchQuery] = useState("");

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    console.log('Selected product:', product);
    // Add any other logic you need when a product is selected
  };

  const startVideoCall = (product: Product) => {
    // Generate unique room name using product ID and wholesaler ID
    const roomName = `FreshFarm-${product.id}-${product.wholesalerId}`;
    setVideoCallRoom(roomName);
    setShowVideoCall(true);
  };

  useEffect(() => {
    const fetchProductsAndWholesalers = async () => {
      try {
        setLoading(true);

        // Fetch products
        const productsRef = collection(db, 'products');
        const productsSnapshot = await getDocs(productsRef);
        const productsData: Product[] = [];

        productsSnapshot.forEach(doc => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            // Set city to the city field or extract from address if not present
            city: data.city || (data.address ? data.address.split(' ').pop() : 'Unknown'),
            ...data
          } as Product);
        });

        // Fetch wholesalers and map to products
        const wholesalersRef = collection(db, 'users');
        const wholesalersSnapshot = await getDocs(wholesalersRef);
        const wholesalersMap = new Map();

        wholesalersSnapshot.forEach(doc => {
          const data = doc.data();
          wholesalersMap.set(doc.id, {
            name: data.name,
            photo: data.photoURL
          });
        });

        // Add wholesaler details to products
        const productsWithWholesalers = productsData.map(product => {
          const wholesaler = wholesalersMap.get(product.wholesalerId);
          return {
            ...product,
            wholesalerName: wholesaler?.name || 'Unknown',
            wholesalerPhoto: wholesaler?.photo || null
          };
        });

        setProducts(productsWithWholesalers);
        setFilteredProducts(productsWithWholesalers);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndWholesalers();
  }, []);

  useEffect(() => {
    // Apply filters whenever they change
    let result = [...products];

    // Apply city filter
    if (selectedCity !== "All Cities") {
      result = result.filter(product =>
        product.city?.toLowerCase().includes(selectedCity.toLowerCase()) ||
        product.address?.toLowerCase().includes(selectedCity.toLowerCase())
      );
    }

    // Apply price range filter
    if (selectedPriceRange !== "All Prices") {
      if (selectedPriceRange === "₹0-500") {
        result = result.filter(product => product.price <= 500);
      } else if (selectedPriceRange === "₹500-1000") {
        result = result.filter(product => product.price > 500 && product.price <= 1000);
      } else if (selectedPriceRange === "₹1000+") {
        result = result.filter(product => product.price > 1000);
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.wholesalerName?.toLowerCase().includes(query)
      );
    }

    setFilteredProducts(result);
  }, [selectedCity, selectedPriceRange, searchQuery, products]);

  useEffect(() => {
    if (selectedProduct) {
      // Set initial quantity to minimum order quantity (5)
      setQuantity(MIN_ORDER_QUANTITY);
    }
  }, [selectedProduct]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleClearFilters = () => {
    setSelectedCity("All Cities");
    setSelectedPriceRange("All Prices");
    setSearchQuery("");
  };

  const activeFiltersCount = [
    selectedCity !== "All Cities",
    selectedPriceRange !== "All Prices",
    searchQuery !== ""
  ].filter(Boolean).length;

  const handleQuantityChange = (value: number) => {
    if (!selectedProduct) return;

    // Ensure quantity is at least MIN_ORDER_QUANTITY and not more than available stock
    const newQuantity = Math.max(MIN_ORDER_QUANTITY, value);
    setQuantity(Math.min(newQuantity, selectedProduct.quantity));
  };

  const handlePayment = async () => {
    if (!selectedProduct || !user) return;

    try {
      // Open Razorpay payment link
      window.open(RAZORPAY_LINK, '_blank');

      // Create order record
      const order: Order = {
        id: `order_${Date.now()}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: quantity,
        amount: selectedProduct.price * quantity,
        status: 'success',
        createdAt: new Date(),
        wholesalerId: selectedProduct.wholesalerId,
        vendorId: user.uid
      };

      // Update product stock in Firestore
      const productRef = doc(db, 'products', selectedProduct.id);
      await updateDoc(productRef, {
        quantity: selectedProduct.quantity - quantity
      });

      // Update local state
      setProducts(products.map(p =>
        p.id === selectedProduct.id
          ? { ...p, quantity: p.quantity - quantity }
          : p
      ));

      // Show success
      setOrderSuccess(order);
      setShowSuccess(true);
      setSelectedProduct(null);

      toast.success('Order placed successfully!');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header searchQuery={''} onSearchChange={() => { }} cartItems={0} />
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-700">Vendor Dashboard</h1>
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="rounded-full p-1 border border-gray-200"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-8 h-8" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <div className="p-3 border-b">
                <div className="flex items-center space-x-3">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt="Profile"
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-xl w-10 h-10" />
                  )}
                  <div>
                    <p className="font-medium">{user?.displayName || 'User'}</p>
                    <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                  </div>
                </div>
              </div>

              <div className="p-3 border-b">
                <p className="text-sm text-gray-500 mb-1">Account Type</p>
                <div className="flex items-center">
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                    Vendor
                  </span>
                  <span className="ml-2 flex items-center text-sm">
                    {user?.providerData[0]?.providerId === 'google.com' ? (
                      <>
                        <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                          <path d="M1 1h22v22H1z" fill="none" />
                        </svg>
                        Google
                      </>
                    ) : (
                      'Email'
                    )}
                  </span>
                </div>
              </div>

              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Find Farm Fresh Supplies</h2>
          <p className="text-gray-600">Premium quality vegetables and fruits sourced directly from farms</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <Input
              placeholder="Search for products, farms, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Button variant="outline">Vegetables</Button>
              <Button variant="outline">Fruits</Button>
              <Button variant="outline">Herbs</Button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-foreground">Filters</span>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount} active
                  </Badge>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* City Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Location
                </label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
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

              {/* Price Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Min Order Value
                </label>
                <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
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
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading fresh products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700">No products found</h3>
            <p className="text-gray-500 mt-1">Try adjusting your filters or search term</p>
            <Button variant="outline" className="mt-4" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="hover:shadow-md transition-shadow">
                {product.imageUrl ? (
                  <div className="h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-200 border-2 border-dashed rounded-t-lg w-full h-48" />
                )}

                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{product.name}</CardTitle>
                    <Badge variant="secondary" className="flex items-center">
                      <span>4.8</span>
                      <span className="ml-1">(156)</span>
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{product.address}</span>
                  </div>
                </CardHeader>

                <CardContent>
                  <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex items-center">
                      {product.wholesalerPhoto ? (
                        <img
                          src={product.wholesalerPhoto}
                          alt={product.wholesalerName}
                          className="w-8 h-8 rounded-full mr-2"
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed rounded-full w-8 h-8 mr-2" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{product.wholesalerName}</p>
                        <p className="text-xs text-gray-500">2-4 hours</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-green-700">₹{product.price}</span>
                      <span className="text-gray-500 text-sm ml-1">/unit</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      Available: {product.quantity} units
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between gap-2">
                  <a
                    href={`tel:${product.countryCode}${product.mobileNo}`}
                    className="flex-1"
                  >
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-2" /> Call
                    </Button>
                  </a>
                  <Button
                    className="flex-1"
                    onClick={() => setSelectedProduct(product)}
                    disabled={product.quantity < MIN_ORDER_QUANTITY}
                  >
                    {product.quantity < MIN_ORDER_QUANTITY ? 'Out of Stock' : 'View Products'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 flex justify-between items-center border-b">
              <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedProduct(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="p-6">
              {selectedProduct.imageUrl ? (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              ) : (
                <div className="bg-gray-200 border-2 border-dashed rounded-lg w-full h-64 mb-6" />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-gray-600">{selectedProduct.description}</p>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Details</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Price per unit:</span>
                      <span className="font-medium">₹{selectedProduct.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Available Stock:</span>
                      <span className="font-medium">{selectedProduct.quantity} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Minimum Order:</span>
                      <span className="font-medium">{selectedProduct.minOrder} units</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Location:</span>
                      <span className="font-medium text-right">{selectedProduct.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quantity Selector */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium mb-3">Order Quantity</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= selectedProduct.minOrder}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="mx-4 text-lg font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full"
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={quantity >= selectedProduct.quantity}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-gray-500">Total Amount</div>
                    <div className="text-xl font-bold text-green-700">
                      ₹{selectedProduct.price * quantity}
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-sm text-gray-500">
                  Minimum order: {selectedProduct.minOrder} units
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-4">
                  {selectedProduct.wholesalerPhoto ? (
                    <img
                      src={selectedProduct.wholesalerPhoto}
                      alt={selectedProduct.wholesalerName}
                      className="w-10 h-10 rounded-full mr-3"
                    />
                  ) : (
                    <div className="bg-gray-200 border-2 border-dashed rounded-full w-10 h-10 mr-3" />
                  )}
                  <div>
                    <h4 className="font-medium">{selectedProduct.wholesalerName}</h4>
                    <p className="text-sm text-gray-500">Delivery: 2-4 hours</p>
                  </div>
                </div>

                <div className="flex justify-between">
                  <a
                    href={`tel:${selectedProduct.countryCode}${selectedProduct.mobileNo}`}
                    className="flex-1 mr-2"
                  >
                    <Button className="w-full">
                      <Phone className="h-4 w-4 mr-2" /> Call: {selectedProduct.countryCode} {selectedProduct.mobileNo}
                    </Button>
                  </a>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => startVideoCall(selectedProduct)}
                  >
                    Video Call
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedProduct(null)}
                >
                  Close
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={handlePayment}
                  disabled={quantity > selectedProduct.quantity || quantity < selectedProduct.minOrder}
                >
                  Place Order (₹{selectedProduct.price * quantity})
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Modal */}
      {showSuccess && orderSuccess && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 text-center">
            <div className="text-green-500 mx-auto mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Order Placed Successfully!</h3>

            <div className="bg-green-50 rounded-lg p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-medium">Product:</div>
                <div>{orderSuccess.productName}</div>

                <div className="font-medium">Quantity:</div>
                <div>{orderSuccess.quantity} units</div>

                <div className="font-medium">Amount:</div>
                <div className="text-green-600 font-bold">₹{orderSuccess.amount}</div>

                <div className="font-medium">Order ID:</div>
                <div className="truncate">{orderSuccess.id}</div>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Your order has been placed and will be delivered soon.
              You can contact the wholesaler for delivery details.
            </p>

            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => setShowSuccess(false)}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      )}
      {showVideoCall && (
        <VideoCall
          roomName={videoCallRoom}
          onClose={() => setShowVideoCall(false)}
          userInfo={{
            displayName: user?.displayName || 'Vendor',
            email: user?.email || ''
          }}
        />
      )}
      <VendorGPTComponent
        onProductSelect={handleProductSelect}
        userLocation={`${user?.displayName || 'vendor'}-location`}
      />
    </div>
  );
};

export default VendorPage;