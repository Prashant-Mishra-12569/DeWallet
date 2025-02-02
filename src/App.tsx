import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import Send from "./pages/Send";
import Recovery from "./pages/Recovery";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route component that checks for wallet existence
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const hasWallet = localStorage.getItem("walletAddress") && 
                   localStorage.getItem("encryptedPrivateKey") && 
                   localStorage.getItem("seedPhrase");
                   
  if (!hasWallet) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/send" element={
              <ProtectedRoute>
                <Send />
              </ProtectedRoute>
            } />
            <Route path="/recovery" element={
              <ProtectedRoute>
                <Recovery />
              </ProtectedRoute>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;