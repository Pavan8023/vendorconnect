// src/components/Layout.tsx
import { Outlet } from "react-router-dom";
import { Header } from "@/components/Header";

export const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <Header searchQuery={""} onSearchChange={function (query: string): void {
            throw new Error("Function not implemented.");
        } } cartItems={0} />
    <main className="flex-grow">
      <Outlet />
    </main>
    {/* Add Footer here if needed */}
  </div>
);