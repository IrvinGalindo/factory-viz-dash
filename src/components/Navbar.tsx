import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Users, Settings, LogOut, Cog, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const Navbar = () => {
  const location = useLocation();
  const { profile, appRole, signOut, canAccess } = useAuth();

  const allNavItems = [
    { to: '/', label: 'Dashboard', icon: BarChart3 },
    { to: '/alerts', label: 'Alertas', icon: Bell },
    { to: '/users', label: 'Gestión de Usuarios', icon: Users },
    { to: '/machines', label: 'Gestión de Máquinas', icon: Cog },
    { to: '/settings', label: 'Configuración', icon: Settings },
  ];

  const navItems = allNavItems.filter(item => canAccess(item.to));

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'engineer': return 'Engineer';
      case 'inspector': return 'Inspector';
      default: return role ?? '';
    }
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Sistema Industrial</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.to}
                  variant={isActive(item.to) ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className={cn(
                    "gap-2",
                    isActive(item.to) && "bg-primary text-primary-foreground"
                  )}
                >
                  <Link to={item.to}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            {profile && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                {profile.inspector_name}
              </span>
            )}
            <Badge variant="outline">{getRoleLabel(appRole)}</Badge>
            <Button variant="ghost" size="sm" className="gap-2" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="flex flex-wrap gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.to}
                  variant={isActive(item.to) ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                  className="gap-2"
                >
                  <Link to={item.to}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
