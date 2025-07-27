// src/components/Footer.tsx
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t bg-white">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="font-bold text-lg">
              <span className="text-green-600">Vendor</span>
              <span className="text-green-800">Connect</span>
            </span>
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-8">
            <Link to="/about" className="text-sm text-gray-600 hover:text-green-600">About</Link>
            <Link to="/contact" className="text-sm text-gray-600 hover:text-green-600">Contact</Link>
            <Link to="/terms" className="text-sm text-gray-600 hover:text-green-600">Terms</Link>
            <Link to="/privacy" className="text-sm text-gray-600 hover:text-green-600">Privacy</Link>
          </div>
          <p className="mt-4 md:mt-0 text-sm text-gray-500">© 2023 VendorConnect. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};