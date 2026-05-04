import { BrowserRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { Toaster as UIToaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import ScrollToTop from "@/components/ScrollToTop";

import Home from "@/pages/Home";
import Cars from "@/pages/Cars";
import CarDetails from "@/pages/CarDetails";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";

import { SiteLayout } from "@/components/site/SiteLayout";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminCars from "@/pages/admin/AdminCars";
import AdminInquiries from "@/pages/admin/AdminInquiries";
import AdminContent from "@/pages/admin/AdminContent";
import AdminSettings from "@/pages/admin/AdminSettings";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* SITE ROUTES */}
            <Route element={<SiteLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/cars" element={<Cars />} />
              <Route path="/cars/:id" element={<CarDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
            </Route>

            {/* AUTH */}
            <Route path="/auth" element={<Auth />} />

            {/* ADMIN ROUTES */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="cars" element={<AdminCars />} />
              <Route path="inquiries" element={<AdminInquiries />} />
              <Route path="content" element={<AdminContent />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
          <UIToaster />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
