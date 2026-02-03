import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { GlobalAlertsProvider } from '@/hooks/useGlobalAlerts';

const Layout = () => {
  return (
    <GlobalAlertsProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <Outlet />
      </div>
    </GlobalAlertsProvider>
  );
};

export default Layout;