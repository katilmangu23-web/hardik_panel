import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { user, logout } = useAuth();

  // Extract first letter of username for avatar
  const firstLetter = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/30 backdrop-blur-sm animate-fade-in">
      <div className="container mx-auto px-2 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Logo size="md" />
          <h1 className="text-sm sm:text-xl font-eurostile-extended text-foreground hidden xs:block tracking-widest">
            DEVICE MANAGEMENT DASHBOARD
          </h1>
          <h1 className="text-sm font-eurostile-extended text-foreground xs:hidden tracking-widest">
            DMD
          </h1>
        </div>

        {/* User avatar dropdown */}
        <div className="flex items-center gap-2 sm:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="User menu"
                className="flex items-center gap-2 focus:outline-none"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <span className="text-xs sm:text-sm font-semibold text-white">
                    {firstLetter}
                  </span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">{firstLetter}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm truncate">{user?.username || 'User'}</div>
                    <div className="text-xs text-muted-foreground truncate">{user?.email || 'user@example.com'}</div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={logout}
                className="text-red-600 focus:text-red-700"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
