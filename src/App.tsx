import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import WalletSelectorDialog from "@/components/wallet/WalletSelectorDialog";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Vault from "./pages/Vault";
import Certification from "./pages/Certification";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <WalletProvider>
        <Toaster />
        <Sonner />
        <WalletSelectorDialog />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/marketplace/:metal" element={<Marketplace />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/certification" element={<Certification />} />
            <Route path="/about" element={<About />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
