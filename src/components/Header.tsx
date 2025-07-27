import { Search, Menu, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  cartItems?: number;
}

export const Header = ({ searchQuery, onSearchChange, cartItems = 0 }: HeaderProps) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(prev => !prev);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 bg-gradient-to-br from-green-500 to-green-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">V</span>
          </div>
          <span className="font-bold text-xl text-foreground">VendorConnect</span>
        </div>

        

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Mobile Menu Toggle */}
          <Button variant="outline" size="icon" className="md:hidden bg-green-100 hover:bg-green-200" onClick={toggleMenu}>
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Get Started (desktop) */}
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700 hidden md:inline-flex"
            onClick={() => navigate('/')}
          >
            Home
          </Button>
          <Button
            variant="default"
            className="bg-green-600 hover:bg-green-700 hidden md:inline-flex"
            onClick={() => navigate('/login')}
          >
            Get Started
          </Button>

        </div>
      </div>

      {/* Mobile Menu Content */}
      {isMenuOpen && (
        <nav className="md:hidden bg-card border-t">
          <ul className="flex flex-col p-4 space-y-2">
            <li><Button variant="default" className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate('/')}>Home</Button></li>
            <li><Button variant="default" className="w-full bg-green-600 hover:bg-green-700" onClick={() => navigate('/login')}>Get Started</Button></li>
          </ul>
        </nav>
      )}
    </header>
  );
};
