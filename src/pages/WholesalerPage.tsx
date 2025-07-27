// src/pages/WholesalerPage.tsx
import { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import VideoCall from '@/components/VideoCall';

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface Product {
  [x: string]: any;
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

const countryCodes = [
  { value: '+91', label: 'India (+91)' },
  { value: '+1', label: 'USA (+1)' },
  { value: '+44', label: 'UK (+44)' },
  { value: '+61', label: 'Australia (+61)' },
  { value: '+65', label: 'Singapore (+65)' },
  { value: '+971', label: 'UAE (+971)' },
];

const cities = [
  "Mumbai",
  "Delhi",
  "Chennai",
  "Hyderabad",
  "Kolkata",
  "Pune",
  "Kolhapur",
  "Bengaluru",
  "Ahmedabad",
  "Surat",
  "Jaipur",
  "Lucknow"
];

const WholesalerPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState<Product>({
    name: '',
    description: '',
    address: '',
    mobileNo: '',
    countryCode: '+91',
    price: 0,
    minOrder: 0,
    quantity: 0,
    city: 'Mumbai',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const widgetRef = useRef<any>(null);
  const navigate = useNavigate();
  
  // Video call states moved inside the component
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [videoCallRoom, setVideoCallRoom] = useState('');

  const startVideoCall = (product: Product) => {
    // Generate the same room name as used in VendorPage
    const roomName = `FreshFarm-${product.id}-${product.wholesalerId}`;
    setVideoCallRoom(roomName);
    setShowVideoCall(true);
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        fetchProducts(user.uid);
      } else {
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;

    const script = document.createElement('script');
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    script.onload = () => {
      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
          uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
          cropping: true,
          multiple: false,
          sources: ['local', 'url'],
          showAdvancedOptions: false,
          styles: {
            palette: {
              window: "#FFFFFF",
              windowBorder: "#90A0B3",
              tabIcon: "#0E9F67",
              menuIcons: "#5A616A",
              textDark: "#000000",
              textLight: "#FFFFFF",
              link: "#0E9F67",
              action: "#FF620C",
              inactiveTabIcon: "#0E9F67",
              error: "#F44235",
              inProgress: "#0E9F67",
              complete: "#20B832",
              sourceBg: "#E4EBF1"
            }
          }
        },
        (error: any, result: any) => {
          if (!error && result.event === 'success') {
            setNewProduct(prev => ({
              ...prev,
              imageUrl: result.info.secure_url
            }));
          }
        }
      );
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [user]);

  const fetchProducts = async (userId: string) => {
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
  };

  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await auth.signOut();
      navigate('/');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(product => product.id !== productId));
      alert('Product deleted successfully!');

      if (editingProductId === productId) {
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: name === 'price' || name === 'minOrder' || name === 'quantity' ? Number(value) : value
    });
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id || null);
    setNewProduct({
      name: product.name,
      description: product.description,
      address: product.address,
      mobileNo: product.mobileNo,
      countryCode: product.countryCode,
      price: product.price,
      minOrder: product.minOrder,
      quantity: product.quantity,
      city: product.city,
      imageUrl: product.imageUrl
    });
  };

  const handleCancelEdit = () => {
    setEditingProductId(null);
    setNewProduct({
      name: '',
      description: '',
      address: '',
      mobileNo: '',
      countryCode: '+91',
      price: 0,
      minOrder: 0,
      quantity: 0,
      city: 'Mumbai',
      imageUrl: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      if (editingProductId) {
        const productRef = doc(db, 'products', editingProductId);
        await updateDoc(productRef, {
          ...newProduct,
          updatedAt: new Date()
        });

        setProducts(products.map(p =>
          p.id === editingProductId ? { ...newProduct, id: editingProductId } : p
        ));

        alert('Product updated successfully!');
      } else {
        const productsRef = collection(db, 'products');
        const docRef = await addDoc(productsRef, {
          ...newProduct,
          wholesalerId: user.uid,
          createdAt: new Date()
        });

        setProducts([...products, { ...newProduct, id: docRef.id }]);
        alert('Product added successfully!');
      }

      handleCancelEdit();
    } catch (error) {
      console.error("Error saving product:", error);
      alert('Failed to save product. Please try again.');
    }
  };

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
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Product Form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h2 className="text-xl font-bold mb-6">
              {editingProductId ? 'Edit Product' : 'Add New Product'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={newProduct.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Fresh Onions"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={newProduct.description}
                  onChange={handleInputChange}
                  placeholder="Product details and features"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address">Business Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={newProduct.address}
                  onChange={handleInputChange}
                  placeholder="Full business address"
                  required
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <select
                  id="city"
                  name="city"
                  value={newProduct.city}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="countryCode">Country Code</Label>
                  <select
                    id="countryCode"
                    name="countryCode"
                    value={newProduct.countryCode}
                    onChange={handleInputChange}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    {countryCodes.map((code) => (
                      <option key={code.value} value={code.value}>
                        {code.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="mobileNo">Mobile Number</Label>
                  <Input
                    id="mobileNo"
                    name="mobileNo"
                    value={newProduct.mobileNo}
                    onChange={handleInputChange}
                    placeholder="Mobile number"
                    type="tel"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price per unit (₹)</Label>
                  <Input
                    type="number"
                    id="price"
                    name="price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    placeholder="e.g., 25"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="minOrder">Minimum Order Quantity</Label>
                  <Input
                    type="number"
                    id="minOrder"
                    name="minOrder"
                    value={newProduct.minOrder}
                    onChange={handleInputChange}
                    placeholder="e.g., 10"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Total Stock Quantity</Label>
                  <Input
                    type="number"
                    id="quantity"
                    name="quantity"
                    value={newProduct.quantity}
                    onChange={handleInputChange}
                    placeholder="e.g., 100"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Product Image</Label>
                <div className="mt-1">
                  {newProduct.imageUrl ? (
                    <div className="flex items-center space-x-4">
                      <img
                        src={newProduct.imageUrl}
                        alt="Preview"
                        className="w-16 h-16 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => widgetRef.current?.open()}
                      >
                        Change Image
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => widgetRef.current?.open()}
                      className="w-full py-8"
                    >
                      <div className="text-gray-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="mt-2">Upload Product Image</p>
                        <p className="text-xs mt-1">Click to upload from your device</p>
                      </div>
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!newProduct.imageUrl}
                >
                  {editingProductId ? 'Update Product' : 'Add Product'}
                </Button>

                {editingProductId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Product List */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-6">Your Products</h2>

            {products.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
                <div className="text-gray-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700">No products yet</h3>
                <p className="text-gray-500 mt-1">Add your first product to start selling</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative">
                    <button
                      onClick={() => handleDeleteProduct(product.id!)}
                      className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 text-red-500"
                      aria-label="Delete product"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="bg-gray-200 border-2 border-dashed w-full h-48" />
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg">{product.name}</h3>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">{product.description}</p>

                      <div className="mt-4 flex justify-between items-center">
                        <div>
                          <span className="font-bold text-green-700">₹{product.price}</span>
                          <span className="text-gray-500 text-sm ml-1">/unit</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Min: {product.minOrder} units
                        </div>
                      </div>

                      <div className="mt-2 flex justify-between">
                        <div className="text-sm">
                          <span className="font-medium">Stock: </span>
                          <span className="text-gray-600">{product.quantity} units</span>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="flex items-center text-sm text-gray-500">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{product.address}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="truncate">{product.city}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <span>{product.countryCode} {product.mobileNo}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleEditProduct(product)}
                        >
                          Edit Product
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => startVideoCall(product)}
                        >
                          Video Call
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
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