import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "@/contexts/WalletContext";
import WalletSelectorDialog from "@/components/wallet/WalletSelectorDialog";
import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";

import CertificateDetail from "./pages/CertificateDetail";
import Vault from "./pages/Vault";
import Certification from "./pages/Certification";
import About from "./pages/About";
import AdminDashboard from "./pages/AdminDashboard";
import Verify from "./pages/Verify";
import TradingViewShowroom from "./pages/TradingViewShowroom";
import Intelligence from "./pages/Intelligence";
import OilGasIntelligence from "./pages/OilGasIntelligence";
import TradingBridge from "./pages/TradingBridge";
import LogRegistry from "./pages/LogRegistry";
import LogRegistry2 from "./pages/LogRegistry2";
import OldBots from "./pages/OldBots";
import Login from "./pages/Login";
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
            <Route path="/marketplace/certificate/:certId" element={<CertificateDetail />} />
            <Route path="/markets" element={<TradingBridge />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/certification" element={<Certification />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/showroom" element={<TradingViewShowroom />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/oil-gas" element={<OilGasIntelligence />} />
            <Route path="/trading-bridge" element={<TradingBridge />} />
            <Route path="/log-registry" element={<LogRegistry />} />
            <Route path="/log-registry-2" element={<LogRegistry2 />} />
            <Route path="/old-bots" element={<OldBots />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
