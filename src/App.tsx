import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
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
import Login from "./pages/Login";
import Deck from "./pages/Deck";
import Globe from "./pages/Globe";
import Investors from "./pages/Investors";
import PipelineV4 from "./pages/PipelineV4";
import Hologram from "./pages/Hologram";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Pipeline V4 stays MOUNTED at all times (hidden off-route) so a running
    pipeline is never killed by navigating to another screen. */
const PersistentPipelineV4 = () => {
  const { pathname } = useLocation();
  const active = pathname === "/pipeline-v4";
  return (
    <div style={{ display: active ? "block" : "none" }} aria-hidden={!active}>
      <PipelineV4 />
    </div>
  );
};

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
            <Route path="/vault" element={<Vault />} />
            <Route path="/certification" element={<Certification />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/showroom" element={<TradingViewShowroom />} />
            <Route path="/intelligence" element={<Intelligence />} />
            <Route path="/oil-gas" element={<OilGasIntelligence />} />
            <Route path="/trading-bridge" element={<TradingBridge />} />
            <Route path="/log-registry" element={<LogRegistry />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/deck" element={<Deck />} />
            <Route path="/globe" element={<Globe />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/pipeline-v4" element={null} />
           <Route path="/hologram" element={<Hologram />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <PersistentPipelineV4 />
        </BrowserRouter>
      </WalletProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
