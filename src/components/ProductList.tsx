// src/components/ProductList.tsx
import { Button } from "@/components/ui/button";
import { Trash2 } from 'lucide-react';

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
}

interface ProductListProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onStartVideoCall: (product: Product) => void;
  loading?: boolean;
}

const ProductList = ({ 
  products, 
  onEditProduct, 
  onDeleteProduct, 
  onStartVideoCall, 
  loading = false 
}: ProductListProps) => {
  const handleDelete = (productId: string, productName: string) => {
    if (window.confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
      onDeleteProduct(productId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
            <div className="bg-gray-200 w-full h-48"></div>
            <div className="p-4 space-y-3">
              <div className="h-6 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700">No products yet</h3>
        <p className="text-gray-500 mt-1">Add your first product to start selling</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden relative group hover:shadow-md transition-shadow">
          <button
            onClick={() => handleDelete(product.id!, product.name)}
            className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-red-50 text-red-500 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label={`Delete ${product.name}`}
          >
            <Trash2 className="h-5 w-5" />
          </button>

          <div className="relative">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-48 object-cover"
                loading="lazy"
              />
            ) : (
              <div className="bg-gray-200 border-2 border-dashed w-full h-48 flex items-center justify-center">
                <span className="text-gray-400">No Image</span>
              </div>
            )}
            
            {/* Stock indicator */}
            <div className="absolute top-2 left-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                product.quantity > 50 ? 'bg-green-100 text-green-800' :
                product.quantity > 10 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {product.quantity} units
              </span>
            </div>
          </div>
          
          <div className="p-4">
            <h3 className="font-bold text-lg mb-1">{product.name}</h3>
            <p className="text-gray-600 text-sm mt-1 line-clamp-2 mb-3">{product.description}</p>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-green-700 text-xl">₹{product.price}</span>
                  <span className="text-gray-500 text-sm ml-1">/unit</span>
                </div>
                <div className="text-sm text-gray-500">
                  Min: {product.minOrder} units
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{product.address}</span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="truncate">{product.city}</span>
              </div>

              <div className="flex items-center text-sm text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>{product.countryCode} {product.mobileNo}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onEditProduct(product)}
              >
                Edit Product
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => onStartVideoCall(product)}
              >
                Video Call
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductList;
