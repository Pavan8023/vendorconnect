import { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { motion, AnimatePresence, Variants } from "framer-motion";

interface Product {
  id: string;
  name: string;
  price: number;
  minOrder: number;
  quantity: number;
  imageUrl: string;
  description: string;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const productsRef = collection(db, 'products');
        const querySnapshot = await getDocs(productsRef);
        
        const productsData: Product[] = [];
        querySnapshot.forEach((doc) => {
          productsData.push({ id: doc.id, ...doc.data() } as Product);
        });
        
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  const filteredProducts = products.filter(product => 
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleShowMore = () => {
    navigate("/login");
  };

  // Animation variants with proper typing
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const heroVariants: Variants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-green-100">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        cartItems={0}
      />
      
      <main className="container mx-auto px-4 py-6 space-y-12">
        {/* Hero Section */}
        <motion.div 
          className="relative rounded-2xl overflow-hidden py-16 px-8 text-center"
          variants={heroVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400/20 to-green-600/20"></div>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-50/90 to-green-100"></div>
          </div>
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.h1 
              className="text-4xl md:text-5xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7 }}
            >
              Discover Quality <span className="text-green-600">Farm Products</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-gray-700 mb-8 max-w-2xl mx-auto"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.7 }}
            >
              Find fresh farm supplies directly from trusted producers across India
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
            >
              <Button 
                className="bg-green-500 hover:bg-green-600 text-black px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
                onClick={handleShowMore}
              >
                Start Exploring
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Featured Categories */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.7 }}
        >
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Popular Categories</h2>
          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {['Vegetables', 'Fruits', 'Dairy', 'Grains', 'Herbs'].map((category, index) => (
              <motion.div
                key={category}
                className="px-6 py-3 bg-white rounded-full shadow-md cursor-pointer hover:shadow-lg transition-all"
                whileHover={{ y: -5, scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
              >
                <span className="font-medium text-gray-700">{category}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Results */}
        <div className="space-y-8" ref={containerRef}>
          <motion.div
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-2xl font-semibold text-gray-900">
              {filteredProducts.length} Products Found
            </h2>
            {searchQuery && (
              <p className="text-gray-600">
                Showing results for "{searchQuery}"
              </p>
            )}
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((item) => (
                <motion.div 
                  key={item}
                  className="bg-white rounded-xl shadow-md overflow-hidden"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="bg-gray-200 border-2 border-dashed w-full h-48 animate-pulse"></div>
                  <div className="p-4 space-y-4">
                    <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <motion.div 
              className="text-center py-12 bg-white rounded-xl shadow-lg"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-block text-6xl mb-4 animate-bounce">🔍</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your search criteria
              </p>
              <Button 
                className="bg-green-500 hover:bg-green-600"
                onClick={() => setSearchQuery('')}
              >
                Clear Search
              </Button>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate={isVisible ? "visible" : "hidden"}
              >
                {filteredProducts.map((product) => (
                  <motion.div 
                    key={product.id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all"
                    variants={itemVariants}
                    whileHover={{ y: -10, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                  >
                    <div className="relative">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="bg-gray-200 border-2 border-dashed w-full h-48" />
                      )}
                      <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                        Fresh!
                      </div>
                    </div>
                    
                    <div className="p-5">
                      <h3 className="font-bold text-xl text-gray-900 mb-2">
                        {product.name}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4">
                        {product.description}
                      </p>
                      
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <span className="font-bold text-amber-600 text-lg">₹{product.price}</span>
                          <span className="text-gray-500 text-sm ml-1">/unit</span>
                        </div>
                        <div className="text-sm text-gray-500 bg-amber-100 px-2 py-1 rounded">
                          Min: {product.minOrder} units
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full bg-green-300 hover:bg-green-500 py-5 rounded-xl text-black font-medium transform transition-all duration-300 hover:scale-[1.02]"
                        onClick={handleShowMore}
                      >
                        View Product
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Testimonials */}
        <motion.div 
          className="py-12 bg-gradient-to-r from-green-100 to-green-200 rounded-2xl px-6"
          initial={{ opacity: 0, y: 50 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-2xl font-semibold text-gray-900 text-center mb-8">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                name: "Rajesh Kumar",
                role: "Restaurant Owner",
                content: "The quality of vegetables I get from FarmConnect is unmatched. My customers always compliment the freshness!",
                avatar: "RK"
              },
              {
                name: "Priya Sharma",
                role: "Homemaker",
                content: "I've been ordering weekly for 6 months now. The produce is always fresh and delivered on time.",
                avatar: "PS"
              },
              {
                name: "Vikram Singh",
                role: "Hotel Chef",
                content: "As a professional chef, I demand the best ingredients. FarmConnect consistently delivers premium quality.",
                avatar: "VS"
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={index}
                className="bg-white p-6 rounded-xl shadow-lg"
                whileHover={{ y: -5 }}
                initial={{ opacity: 0, y: 20 }}
                animate={isVisible ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: index * 0.2 }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-black font-bold text-lg mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.content}"</p>
                <div className="flex mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div 
          className="bg-green-300 rounded-2xl p-8 text-center text-black"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={isVisible ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-3xl font-bold mb-4">Ready to experience farm-fresh goodness?</h2>
          <p className="text-black text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of satisfied customers who get fresh produce delivered to their doorstep
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button 
              className="bg-green text-black border-2 border-black hover:bg-green-500 px-8 py-6 text-lg rounded-full font-bold shadow-lg"
              onClick={handleShowMore}
            >
              Sign Up Now
            </Button>
            <Button 
              className="bg-green-300 border-2 border-black hover:bg-green-500 px-8 py-6 text-lg text-black rounded-full font-bold"
              onClick={handleShowMore}
            >
              Browse Products
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Index;