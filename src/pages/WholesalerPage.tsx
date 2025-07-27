// src/pages/WholesalerPage.tsx
import { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import WholesalerBidRequestsModal from '@/components/WholesalerBidRequestsModal';
import WholesalerOrdersModal from '@/components/WholesalerOrdersModal';
import ProductUploadForm from '@/components/ProductUploadForm';
import ProductList from '@/components/ProductList';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BidRequest, Order } from '@/types';
import VideoCall from '@/components/VideoCall';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id?: string;
  name: string;
  description: string;
  address: string;
  mobileNo: string;
  countryCode: string;
  price: number;
  minOrder: number;
  quantity: number;
  city: string;
  imageUrl: string;
  wholesalerId?: string;
}

const WholesalerPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const navigate = useNavigate();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Video call states
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState('');
  const { toast } = useToast();
  
  // Bid management states
  const [bidRequests, setBidRequests] = useState<BidRequest[]>([]);
  const [showBidRequests, setShowBidRequests] = useState(false);
  
  // Orders management states
  const [orders, setOrders] = useState<Order[]>([]);
  const [showOrders, setShowOrders] = useState(false);

  const startVideoCall = (product: Product) => {
    const roomName = `FreshFarm-${product.id}-${product.wholesalerId}`;
    setVideoCallRoom(roomName);
    setShowVideoCall(true);
  };

  const fetchBidRequests = async () => {
    try {
      const bidRequestsRef = collection(db, 'bidRequests');
      const q = query(bidRequestsRef, where('status', '==', 'pending'));
      const querySnapshot = await getDocs(q);

      const requests: BidRequest[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        requests.push({ 
          id: doc.id, 
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          acceptedAt: data.acceptedAt?.toDate(),
        } as BidRequest);
      });

      setBidRequests(requests.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error("Error fetching bid requests:", error);
    }
  };

  const fetchOrders = async () => {
    if (!user) return;
    
    try {
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('wholesalerId', '==', user.uid));
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

      setOrders(ordersList.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const fetchProducts = async (userId: string) => {
    try {
      setProductsLoading(true);
      const productsRef = collection(db, 'products');
      const q = query(productsRef);
      const querySnapshot = await getDocs(q);

      const productsData: Product[] = [];
      querySnapshot.forEach((doc) => {
        if (doc.data().wholesalerId === userId) {
          productsData.push({ id: doc.id, ...doc.data() } as Product);
        }
      });

      setProducts(productsData);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch products. Please refresh the page.'
      });
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAcceptBid = async (bidRequest: BidRequest) => {
    if (!user) return;

    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const estimatedDelivery = new Date();
      estimatedDelivery.setHours(estimatedDelivery.getHours() + 4);

      const newOrder: Omit<Order, 'id'> = {
        bidRequestId: bidRequest.id,
        productName: bidRequest.productName,
        quantity: bidRequest.quantity,
        pricePerUnit: bidRequest.bidPrice,
        totalAmount: bidRequest.bidPrice * bidRequest.quantity,
        vendorId: bidRequest.vendorId,
        vendorName: bidRequest.vendorName,
        wholesalerId: user.uid,
        wholesalerName: user.displayName || 'Wholesaler',
        status: 'confirmed',
        createdAt: new Date(),
        deliveryAddress: bidRequest.location,
        estimatedDelivery: estimatedDelivery
      };

      const orderRef = await addDoc(collection(db, 'orders'), newOrder);

      const bidRef = doc(db, 'bidRequests', bidRequest.id);
      await updateDoc(bidRef, {
        status: 'order_placed',
        acceptedBy: user.uid,
        acceptedAt: new Date(),
        wholesalerName: user.displayName || 'Wholesaler',
        wholesalerContact: user.email || '',
        orderId: orderRef.id,
        orderPlacedAt: new Date()
      });

      setBidRequests(prev => prev.filter(req => req.id !== bidRequest.id));
      fetchOrders();
      
      toast({
        title: 'Order Created Successfully!',
        description: `Order placed for ${bidRequest.productName}. Estimated delivery: ${estimatedDelivery.toLocaleTimeString()}`
      });
    } catch (error) {
      console.error('Error accepting bid:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create order. Please try again.'
      });
    }
  };

  const handleRejectBid = async (bidId: string) => {
    try {
      const bidRef = doc(db, 'bidRequests', bidId);
      await updateDoc(bidRef, {
        status: 'rejected',
        rejectedAt: new Date()
      });

      setBidRequests(prev => prev.filter(req => req.id !== bidId));
      toast({
        title: 'Bid Rejected',
        description: 'The bid request has been rejected.'
      });
    } catch (error) {
      console.error('Error rejecting bid:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject bid request. Please try again.'
      });
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date()
      });

      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));

      toast({
        title: 'Order Updated',
        description: `Order status changed to ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update order status.'
      });
    }
  };

  const handleSubmitProduct = async (productData: Omit<Product, 'id'>) => {
    if (!user) return;

    try {
      if (editingProduct?.id) {
        // Update existing product
        const productRef = doc(db, 'products', editingProduct.id);
        await updateDoc(productRef, {
          ...productData,
          updatedAt: new Date()
        });

        setProducts(prev => prev.map(p =>
          p.id === editingProduct.id ? { ...productData, id: editingProduct.id } : p
        ));

        toast({
          title: 'Product Updated',
          description: 'Product has been updated successfully.'
        });
      } else {
        // Add new product
        const productsRef = collection(db, 'products');
        const docRef = await addDoc(productsRef, {
          ...productData,
          wholesalerId: user.uid,
          wholesalerName: user.displayName || 'Wholesaler',
          wholesalerPhoto: user.photoURL || '',
          createdAt: new Date()
        });

        setProducts(prev => [...prev, { ...productData, id: docRef.id }]);
        toast({
          title: 'Product Added',
          description: 'Product has been added successfully.'
        });
      }

      setEditingProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to save product. Please try again.'
      });
      throw error; // Re-throw to handle in form component
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(prev => prev.filter(product => product.id !== productId));
      
      toast({
        title: 'Product Deleted',
        description: 'Product has been deleted successfully.'
      });

      if (editingProduct?.id === productId) {
        setEditingProduct(null);
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete product. Please try again.'
      });
    }
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to log out. Please try again.'
      });
    }
  };

  // Authentication effect
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch data when user changes
  useEffect(() => {
    if (user) {
      fetchProducts(user.uid);
      fetchBidRequests();
      fetchOrders();
    }
  }, [user]);

  // Set up interval for bid requests and orders
  useEffect(() => {
    if (user) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        fetchBidRequests();
        fetchOrders();
      }, 30000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header searchQuery={''} onSearchChange={() => { }} cartItems={0} />
        <main className="flex-grow container mx-auto px-4 py-8 flex justify-center items-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading wholesaler dashboard...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header searchQuery={''} onSearchChange={() => { }} cartItems={0} />
      
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-green-700">Wholesaler Dashboard</h1>
          
          <div className="flex items-center space-x-4">
            {/* Bid Requests Button */}
            <Button
              variant="outline"
              onClick={() => setShowBidRequests(!showBidRequests)}
              className="relative"
            >
              💰 Bid Requests
              {bidRequests.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {bidRequests.length}
                </span>
              )}
            </Button>

            {/* Orders Button */}
            <Button
              variant="outline"
              onClick={() => setShowOrders(!showOrders)}
              className="relative"
            >
              <Package className="h-4 w-4 mr-2" />
              Orders
              {orders.filter(order => order.status === 'confirmed').length > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {orders.filter(order => order.status === 'confirmed').length}
                </span>
              )}
            </Button>

            {/* Profile Dropdown */}
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
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                      Wholesaler
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
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Upload Form Sidebar */}
          <div className="lg:col-span-1">
            <ProductUploadForm
              editingProduct={editingProduct}
              onSubmit={handleSubmitProduct}
              onCancel={handleCancelEdit}
              loading={productsLoading}
            />
          </div>

          {/* Product List */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Your Products</h2>
              <span className="text-sm text-gray-500">
                {products.length} product{products.length !== 1 ? 's' : ''}
              </span>
            </div>

            <ProductList
              products={products}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onStartVideoCall={startVideoCall}
              loading={productsLoading}
            />
          </div>
        </div>
      </main>

      {/* Use the broken-down modal components */}
      <WholesalerBidRequestsModal
        isOpen={showBidRequests}
        onClose={() => setShowBidRequests(false)}
        bidRequests={bidRequests}
        onRefresh={fetchBidRequests}
        onAcceptBid={handleAcceptBid}
        onRejectBid={handleRejectBid}
      />

      <WholesalerOrdersModal
        isOpen={showOrders}
        onClose={() => setShowOrders(false)}
        orders={orders}
        onRefresh={fetchOrders}
        onUpdateOrderStatus={updateOrderStatus}
      />

      <Footer />
      
      {showVideoCall && (
        <VideoCall
          roomName={videoCallRoom}
          onClose={() => setShowVideoCall(false)}
          userInfo={{
            displayName: user?.displayName || 'Wholesaler',
            email: user?.email || ''
          }}
        />
      )}
    </div>
  );
};

export default WholesalerPage;
