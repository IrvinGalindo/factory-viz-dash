import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useGlobalAlerts } from '@/hooks/useGlobalAlerts';

const Layout = () => {
  // Global WebSocket connection for alerts across all pages
  useGlobalAlerts({ enabled: true });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  );
};

export default Layout;