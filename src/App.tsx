import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Login from "./pages/login";
import SignUp from "./pages/SignUp";
import NotFound from "./pages/NotFound";
import VendorPage from "./pages/VendorPage"; 
import WholesalerPage from "./pages/WholesalerPage"; 
import AuthRoute from "@/components/AuthRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>  
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          
          {/* Protected routes */}
          <Route 
            path="/vendor" 
            element={
              <AuthRoute role="vendor">
                <VendorPage />
              </AuthRoute>
            } 
          />
          <Route 
            path="/wholesaler" 
            element={
              <AuthRoute role="wholesaler">
                <WholesalerPage />
              </AuthRoute>
            } 
          />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;