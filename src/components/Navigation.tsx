import { NavLink } from 'react-router-dom';
import { BarChart3, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Navigation() {
  const navItems = [
    { to: '/overview', icon: BarChart3, label: 'Overview' },
    { to: '/devices', icon: Smartphone, label: 'Device Management' }
  ];

  return (
    <nav className="border-b bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex space-x-8">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative',
                  'hover:text-primary',
                  isActive
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground'
                )
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}