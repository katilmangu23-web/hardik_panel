import { NavLink } from "react-router-dom";
import { BarChart3, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const navItems = [
    { to: "/overview", icon: BarChart3, label: "Overview" },
    { to: "/devices", icon: Smartphone, label: "Device Management" },
  ];

  return (
    <nav className="border-b bg-background/30 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex space-x-2 sm:space-x-8 overflow-x-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 relative whitespace-nowrap",
                  "hover:text-primary hover:bg-primary/5 rounded-lg",
                  isActive
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-foreground/80 hover:text-foreground",
                )
              }
            >
              <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline">{label}</span>
              <span className="xs:hidden">
                {label === "Overview" ? "Home" : "Devices"}
              </span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
