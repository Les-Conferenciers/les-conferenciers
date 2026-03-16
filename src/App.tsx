import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Speakers from "./pages/Speakers";
import SpeakerDetail from "./pages/SpeakerDetail";
import Contact from "./pages/Contact";
import Blog from "./pages/Blog";
import BlogArticle from "./pages/BlogArticle";
import Legal from "./pages/Legal";
import RGPD from "./pages/RGPD";
import Cookies from "./pages/Cookies";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import ProposalView from "./pages/ProposalView";
import ContractView from "./pages/ContractView";
import ContractSign from "./pages/ContractSign";
import InvoiceView from "./pages/InvoiceView";
import SpeakerContractView from "./pages/SpeakerContractView";
import LiaisonSheetView from "./pages/LiaisonSheetView";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/conferenciers" element={<Speakers />} />
          <Route path="/conferencier/:slug" element={<SpeakerDetail />} />
          <Route path="/speakers" element={<Navigate to="/conferenciers" replace />} />
          <Route path="/speakers/:slug" element={<SpeakerDetail />} />
          <Route path="/speaker/:slug" element={<SpeakerDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/mentions-legales" element={<Legal />} />
          <Route path="/rgpd" element={<RGPD />} />
          <Route path="/cookies" element={<Cookies />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogArticle />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/propositions" element={<Navigate to="/admin?tab=propositions" replace />} />
          <Route path="/proposition/:token" element={<ProposalView />} />
          <Route path="/admin/contrat/:id" element={<ContractView />} />
          <Route path="/admin/contrat-conferencier/:id" element={<SpeakerContractView />} />
          <Route path="/admin/feuille-liaison/:id" element={<LiaisonSheetView />} />
          <Route path="/signer-contrat/:token" element={<ContractSign />} />
          <Route path="/admin/facture/:id" element={<InvoiceView />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
