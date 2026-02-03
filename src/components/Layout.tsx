import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useGlobalAlerts } from '@/hooks/useGlobalAlerts';
import { Toaster } from '@/components/ui/sonner';

const Layout = () => {
  // Global WebSocket connection for alerts across all pages
  useGlobalAlerts({ enabled: true });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
};

export default Layout;