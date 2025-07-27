// src/pages/VendorPage.tsx
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, doc, getDoc, getDocs, query, updateDoc, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import VideoCall from '@/components/VideoCall';
import MyBidsModal from '@/components/MyBidsModal';
import MyOrdersModal from '@/components/MyOrderModal';
import type { Product, BidRequest, Order } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User, LogOut, X, Phone, Minus, Plus, CheckCircle, Package, Clock, MapPin, Edit2, Loader2 } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import VendorGPTComponent from '@/components/VendorGPT';

interface OrderInterface {
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

interface UserLocation {
  pincode?: string;
  address?: string;
  city?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
  isManual?: boolean;
  detectedAt?: string; // ISO string timestamp
  updatedAt?: string; // ISO string timestamp
}

const cities = ["All Cities", "Mumbai", "Delhi", "Chennai", "Hyderabad", "Kolkata", "Pune", "Kolhapur"];
const priceRanges = ["All Prices", "₹0-500", "₹500-1000", "₹1000+"];
const RAZORPAY_LINK = "https://rzp.io/rzp/mog0llFL";
const MIN_ORDER_QUANTITY = 5;

const VendorPage = () => {
  const [user] = useAuthState(auth);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<OrderInterface | null>(null);
  const [quantity, setQuantity] = useState(MIN_ORDER_QUANTITY);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState('');

  // Location states
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [showLocationEdit, setShowLocationEdit] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isSearchingPincode, setIsSearchingPincode] = useState(false);
  const [locationForm, setLocationForm] = useState({
    pincode: '',
    address: '',
    city: '',
    state: ''
  });

  // Filter states
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All Prices");
  const [searchQuery, setSearchQuery] = useState("");

  // Bid management states
  const [myBidRequests, setMyBidRequests] = useState<BidRequest[]>([]);
  const [showMyBids, setShowMyBids] = useState(false);

  // Orders management states
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [showMyOrders, setShowMyOrders] = useState(false);

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    console.log('Selected product:', product);
  };

  const startVideoCall = (product: Product) => {
    const roomName = `FreshFarm-${product.id}-${product.wholesalerId}`;
    setVideoCallRoom(roomName);
    setShowVideoCall(true);
  };

  // Location functions
  const saveUserLocation = async (location: UserLocation) => {
    if (!user) return;
    try {
      // Update user document with location in the users collection
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 
        location: location,
        updatedAt: new Date() // Add timestamp for when location was updated
      });
      console.log('Location saved to user profile successfully');
    } catch (error) {
      console.error('Error saving location to database:', error);
      throw error; // Re-throw to handle in the calling function
    }
  };

  // Load user location on component mount
  useEffect(() => {
    const loadUserLocation = async () => {
      if (!user) return;
      try {
        // Fetch user document from users collection
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.location) {
            setUserLocation(userData.location);
            console.log('User location loaded:', userData.location);
          }
        }
      } catch (error) {
        console.error('Error loading user location:', error);
      }
    };
    
    loadUserLocation();
  }, [user]);

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      setIsDetectingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // For production, you can integrate with reverse geocoding APIs
          // For now, using a simple location structure
          const location: UserLocation = {
            latitude,
            longitude,
            address: `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`,
            city: 'Auto-detected location',
            state: 'Unknown',
            pincode: '',
            detectedAt: new Date().toISOString(),
            isManual: false
          };
          
          setUserLocation(location);
          await saveUserLocation(location);
          toast.success('Location detected and saved successfully');
          
        } catch (error) {
          console.error('Error getting location details:', error);
          toast.error('Failed to save location details');
        } finally {
          setIsDetectingLocation(false);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        let errorMessage = 'Failed to detect location. Please add manually.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions and try again.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please add location manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        
        toast.error(errorMessage);
        setIsDetectingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000, // 15 seconds timeout
        maximumAge: 300000 // Accept 5-minute old location
      }
    );
  };

  const handlePincodeSearch = async () => {
    if (locationForm.pincode.length !== 6) return;
    
    setIsSearchingPincode(true);
    
    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${locationForm.pincode}`);
      const data = await response.json();
      
      if (data[0].Status === 'Success' && data[0].PostOffice.length > 0) {
        const postOffice = data[0].PostOffice[0];
        setLocationForm({
          ...locationForm,
          city: postOffice.District,
          state: postOffice.State,
          address: `${postOffice.Name}, ${postOffice.District}, ${postOffice.State}`
        });
        toast.success('Location details filled from pincode');
      } else {
        toast.error('Invalid pincode or no data found');
      }
    } catch (error) {
      console.error('Error searching pincode:', error);
      toast.error('Failed to search pincode');
    } finally {
      setIsSearchingPincode(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      // Validate required fields
      if (!locationForm.city || !locationForm.pincode) {
        toast.error('Please fill in at least city and pincode');
        return;
      }

      // Validate pincode format (assuming Indian pincode)
      if (!/^\d{6}$/.test(locationForm.pincode)) {
        toast.error('Please enter a valid 6-digit pincode');
        return;
      }

      const location: UserLocation = {
        pincode: locationForm.pincode,
        address: locationForm.address,
        city: locationForm.city,
        state: locationForm.state,
        isManual: true,
        updatedAt: new Date().toISOString()
      };
      
      setUserLocation(location);
      await saveUserLocation(location);
      setShowLocationEdit(false);
      setLocationForm({ pincode: '', address: '', city: '', state: '' });
      toast.success('Location saved successfully');
    } catch (error) {
      console.error('Error saving location:', error);
      toast.error('Failed to save location. Please try again.');
    }
  };

  // Fetch user's bid requests
  const fetchMyBidRequests = async () => {
    if (!user) return;
    
    try {
      const bidRequestsRef = collection(db, 'bidRequests');
      const q = query(bidRequestsRef, where('vendorId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const requests: BidRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          acceptedAt: data.acceptedAt?.toDate(),
          orderPlacedAt: data.orderPlacedAt?.toDate(),
        } as BidRequest);
      });

      setMyBidRequests(requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error("Error fetching bid requests:", error);
      toast.error("Failed to fetch bid requests");
    }
  };

  // Fetch user's orders
  const fetchMyOrders = async () => {
    if (!user) return;
    
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('vendorId', '==', user.uid));
      const querySnapshot = await getDocs(q);

      const ordersList: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        ordersList.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          estimatedDelivery: data.estimatedDelivery?.toDate(),
        } as Order);
      });

      setMyOrders(ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to fetch orders");
    }
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
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProductsAndWholesalers();
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyBidRequests();
      fetchMyOrders();
      const interval = setInterval(() => {
        fetchMyBidRequests();
        fetchMyOrders();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

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
      setQuantity(MIN_ORDER_QUANTITY);
    }
  }, [selectedProduct]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to log out");
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
    const newQuantity = Math.max(MIN_ORDER_QUANTITY, value);
    setQuantity(Math.min(newQuantity, selectedProduct.quantity));
  };

  const handlePayment = async () => {
    if (!selectedProduct || !user) return;

    try {
      window.open(RAZORPAY_LINK, '_blank');

      const order: OrderInterface = {
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

      const productRef = doc(db, 'products', selectedProduct.id);
      await updateDoc(productRef, {
        quantity: selectedProduct.quantity - quantity
      });

      setProducts(products.map(p =>
        p.id === selectedProduct.id
          ? { ...p, quantity: p.quantity - quantity }
          : p
      ));

      setOrderSuccess(order);
      setShowSuccess(true);
      setSelectedProduct(null);
      
      // Refresh orders list
      fetchMyOrders();
      
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
          
          <div className="flex items-center space-x-4">
            {/* My Bids Button */}
            <Button 
              variant="outline" 
              onClick={() => setShowMyBids(true)}
              className="relative"
            >
              📋 My Bids
              {myBidRequests.filter(bid => bid.status === 'order_placed').length > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {myBidRequests.filter(bid => bid.status === 'order_placed').length}
                </span>
              )}
            </Button>

            {/* My Orders Button */}
            <Button 
              variant="outline" 
              onClick={() => setShowMyOrders(true)}
              className="relative"
            >
              <Package className="h-4 w-4 mr-2" />
              My Orders
              {myOrders.filter(order => ['confirmed', 'shipped'].includes(order.status)).length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {myOrders.filter(order => ['confirmed', 'shipped'].includes(order.status)).length}
                </span>
              )}
            </Button>

            {/* Profile Dropdown with Location */}
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

                {/* Location Section */}
                <div className="p-3 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-500">Location</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDetectLocation}
                      disabled={isDetectingLocation}
                      className="text-xs p-1 h-6"
                    >
                      {isDetectingLocation ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <MapPin className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  
                  {userLocation ? (
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{userLocation.city}</p>
                          <p className="text-xs text-gray-500 truncate">{userLocation.address}</p>
                          {userLocation.pincode && (
                            <p className="text-xs text-gray-500">PIN: {userLocation.pincode}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLocationEdit(true)}
                        className="w-full text-xs h-7"
                      >
                        <Edit2 className="h-3 w-3 mr-1" />
                        Edit Location
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-400">No location set</p>
                      <div className="space-y-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDetectLocation}
                          disabled={isDetectingLocation}
                          className="w-full text-xs h-7"
                        >
                          {isDetectingLocation ? (
                            <>
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              Detecting...
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3 mr-1" />
                              Auto Detect
                            </>
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowLocationEdit(true)}
                          className="w-full text-xs h-7"
                        >
                          <Edit2 className="h-3 w-3 mr-1" />
                          Add Manually
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            <p className="text-gray-500 mt-1">Try adjusting your filters, search term, or use VendorGPT to create a bid request</p>
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

      {/* Location Edit Modal */}
      {showLocationEdit && (
        <Dialog open={showLocationEdit} onOpenChange={setShowLocationEdit}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Set Your Location</DialogTitle>
              <DialogDescription>
                Enter your address details or pincode to set your location.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  placeholder="Enter 6-digit pincode"
                  value={locationForm.pincode}
                  onChange={(e) => setLocationForm({...locationForm, pincode: e.target.value})}
                  maxLength={6}
                />
                {locationForm.pincode && locationForm.pincode.length === 6 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePincodeSearch}
                    disabled={isSearchingPincode}
                    className="text-xs"
                  >
                    {isSearchingPincode ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      'Auto-fill from Pincode'
                    )}
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  placeholder="Enter your full address"
                  value={locationForm.address}
                  onChange={(e) => setLocationForm({...locationForm, address: e.target.value})}
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    placeholder="City"
                    value={locationForm.city}
                    onChange={(e) => setLocationForm({...locationForm, city: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={locationForm.state}
                    onChange={(e) => setLocationForm({...locationForm, state: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLocationEdit(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLocation} disabled={!locationForm.city || !locationForm.pincode}>
                Save Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
      
      <MyBidsModal
        isOpen={showMyBids}
        onClose={() => setShowMyBids(false)}
        bidRequests={myBidRequests}
        onRefresh={fetchMyBidRequests}
      />

      <MyOrdersModal
        isOpen={showMyOrders}
        onClose={() => setShowMyOrders(false)}
        orders={myOrders}
        onRefresh={fetchMyOrders}
      />

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
      />

      <Footer />
    </div>
  );
};

export default VendorPage;
