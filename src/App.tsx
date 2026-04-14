import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";

// Lazy-loaded routes for code splitting
const Speakers = lazy(() => import("./pages/Speakers"));
const SpeakerDetail = lazy(() => import("./pages/SpeakerDetail"));
const Contact = lazy(() => import("./pages/Contact"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogArticle = lazy(() => import("./pages/BlogArticle"));
const Legal = lazy(() => import("./pages/Legal"));
const RGPD = lazy(() => import("./pages/RGPD"));
const Cookies = lazy(() => import("./pages/Cookies"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ProposalView = lazy(() => import("./pages/ProposalView"));
const ContractView = lazy(() => import("./pages/ContractView"));
const ContractSign = lazy(() => import("./pages/ContractSign"));
const InvoiceView = lazy(() => import("./pages/InvoiceView"));
const SpeakerContractView = lazy(() => import("./pages/SpeakerContractView"));
const LiaisonSheetView = lazy(() => import("./pages/LiaisonSheetView"));

const queryClient = new QueryClient();

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<LazyFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/conferencier" element={<Speakers />} />
            <Route path="/conferenciers" element={<Navigate to="/conferencier" replace />} />
            <Route path="/conferencier/:slug" element={<SpeakerDetail />} />
            <Route path="/speakers" element={<Navigate to="/conferencier" replace />} />
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
