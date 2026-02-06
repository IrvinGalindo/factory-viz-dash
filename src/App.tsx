import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Users from "./pages/Users";
import Machines from "./pages/Machines";
import Settings from "./pages/Settings";
import Alerts from "./pages/Alerts";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner position="top-right" richColors closeButton />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Index />} />
              <Route path="users" element={<ProtectedRoute requiredAccess="/users"><Users /></ProtectedRoute>} />
              <Route path="machines" element={<ProtectedRoute requiredAccess="/machines"><Machines /></ProtectedRoute>} />
              <Route path="alerts" element={<ProtectedRoute requiredAccess="/alerts"><Alerts /></ProtectedRoute>} />
              <Route path="settings" element={<ProtectedRoute requiredAccess="/settings"><Settings /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
