import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';

declare global {
  interface Window {
    cloudinary: any;
  }
}

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

interface ProductUploadFormProps {
  editingProduct: Product | null;
  onSubmit: (product: Omit<Product, 'id'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
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

const ProductUploadForm = ({ editingProduct, onSubmit, onCancel, loading = false }: ProductUploadFormProps) => {
  const [formData, setFormData] = useState<Product>({
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const widgetRef = useRef<any>(null);
  const { toast } = useToast();

  // Initialize form data when editing product changes
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name,
        description: editingProduct.description,
        address: editingProduct.address,
        mobileNo: editingProduct.mobileNo,
        countryCode: editingProduct.countryCode,
        price: editingProduct.price,
        minOrder: editingProduct.minOrder,
        quantity: editingProduct.quantity,
        city: editingProduct.city,
        imageUrl: editingProduct.imageUrl
      });
    } else {
      setFormData({
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
    }
  }, [editingProduct]);

  // Initialize Cloudinary widget
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
    script.async = true;
    script.onload = () => {
      if (window.cloudinary) {
        widgetRef.current = window.cloudinary.createUploadWidget(
          {
            cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
            uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
            cropping: true,
            multiple: false,
            sources: ['local', 'url'],
            showAdvancedOptions: false,
            maxFileSize: 10 * 1024 * 1024, 
            
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
              setFormData(prev => ({
                ...prev,
                imageUrl: result.info.secure_url
              }));
              toast({
                title: 'Image Uploaded',
                description: 'Product image uploaded successfully!'
              });
            } else if (error) {
              toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Failed to upload image. Please try again.'
              });
            }
          }
        );
      }
    };
    
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'minOrder' || name === 'quantity' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Product name is required.'
      });
      return;
    }

    if (!formData.description.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Product description is required.'
      });
      return;
    }

    if (!formData.address.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Business address is required.'
      });
      return;
    }

    if (!formData.mobileNo.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Mobile number is required.'
      });
      return;
    }

    if (formData.price <= 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Price must be greater than 0.'
      });
      return;
    }

    if (formData.minOrder <= 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Minimum order quantity must be greater than 0.'
      });
      return;
    }

    if (formData.quantity <= 0) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Stock quantity must be greater than 0.'
      });
      return;
    }

    if (!formData.imageUrl) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Product image is required.'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form if not editing (new product)
      if (!editingProduct) {
        setFormData({
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
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
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
    onCancel();
  };

  const openImageUploader = () => {
    if (widgetRef.current) {
      widgetRef.current.open();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Image uploader not ready. Please try again in a moment.'
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-4">
      <h2 className="text-xl font-bold mb-6">
        {editingProduct ? 'Edit Product' : 'Add New Product'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Product Name */}
        <div>
          <Label htmlFor="name">Product Name *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., Fresh Onions"
            required
            disabled={isSubmitting || loading}
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Product details and features"
            rows={3}
            required
            disabled={isSubmitting || loading}
          />
        </div>

        {/* Business Address */}
        <div>
          <Label htmlFor="address">Business Address *</Label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Full business address"
            required
            disabled={isSubmitting || loading}
          />
        </div>

        {/* City */}
        <div>
          <Label htmlFor="city">City *</Label>
          <select
            id="city"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
            className="w-full p-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
            disabled={isSubmitting || loading}
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Country Code and Mobile Number */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1">
            <Label htmlFor="countryCode">Country Code *</Label>
            <select
              id="countryCode"
              name="countryCode"
              value={formData.countryCode}
              onChange={handleInputChange}
              className="w-full p-2 border rounded-md disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              disabled={isSubmitting || loading}
            >
              {countryCodes.map((code) => (
                <option key={code.value} value={code.value}>
                  {code.label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <Label htmlFor="mobileNo">Mobile Number *</Label>
            <Input
              id="mobileNo"
              name="mobileNo"
              value={formData.mobileNo}
              onChange={handleInputChange}
              placeholder="Mobile number"
              type="tel"
              required
              disabled={isSubmitting || loading}
            />
          </div>
        </div>

        {/* Price, Min Order, and Quantity */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="price">Price per unit (₹) *</Label>
            <Input
              type="number"
              id="price"
              name="price"
              value={formData.price || ''}
              onChange={handleInputChange}
              placeholder="e.g., 25"
              min="0"
              step="0.01"
              required
              disabled={isSubmitting || loading}
            />
          </div>

          <div>
            <Label htmlFor="minOrder">Min Order Qty *</Label>
            <Input
              type="number"
              id="minOrder"
              name="minOrder"
              value={formData.minOrder || ''}
              onChange={handleInputChange}
              placeholder="e.g., 10"
              min="1"
              required
              disabled={isSubmitting || loading}
            />
          </div>

          <div>
            <Label htmlFor="quantity">Stock Qty *</Label>
            <Input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity || ''}
              onChange={handleInputChange}
              placeholder="e.g., 100"
              min="1"
              required
              disabled={isSubmitting || loading}
            />
          </div>
        </div>

        {/* Product Image */}
        <div>
          <Label>Product Image *</Label>
          <div className="mt-1">
            {formData.imageUrl ? (
              <div className="flex items-center space-x-4">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-16 h-16 object-cover rounded-md border"
                />
                <div className="flex flex-col space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={openImageUploader}
                    disabled={isSubmitting || loading}
                  >
                    Change Image
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
                    disabled={isSubmitting || loading}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove Image
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={openImageUploader}
                className="w-full py-8 border-dashed"
                disabled={isSubmitting || loading}
              >
                <div className="text-gray-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mt-2 font-medium">Upload Product Image</p>
                  <p className="text-xs mt-1">Click to upload from your device</p>
                </div>
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JPG, PNG, WebP. Max size: 10MB
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex space-x-3 pt-4">
          <Button
            type="submit"
            className="flex-1 bg-green-600 hover:bg-green-700"
            disabled={!formData.imageUrl || isSubmitting || loading}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {editingProduct ? 'Updating...' : 'Adding...'}
              </>
            ) : (
              editingProduct ? 'Update Product' : 'Add Product'
            )}
          </Button>

          {editingProduct && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isSubmitting || loading}
            >
              Cancel
            </Button>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          * Required fields
        </p>
      </form>
    </div>
  );
};

export default ProductUploadForm;
