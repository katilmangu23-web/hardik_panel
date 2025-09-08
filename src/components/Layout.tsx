import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Navigation } from "./Navigation";
import { useState, useEffect, useRef } from "react";
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
import { LogOut } from "lucide-react";

function UserAvatar() {
  const { user, logout } = useAuth();
  const firstLetter = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
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
              <div className="text-sm truncate">{'User'}</div>
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
  );
}

export function Layout() {
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const location = useLocation();
  const isDevicePage = location.pathname.startsWith('/device/');

  useEffect(() => {
    // Show content immediately
    setShowVideo(true);
    setIsLoading(false);
    
    // Load video in background with minimal delay
    const timer = setTimeout(() => {
      if (videoRef.current) {
        // Start loading video
        videoRef.current.load();
      }
    }, 100); // Small delay to ensure content renders first

    return () => clearTimeout(timer);
  }, []);

  const handleVideoLoad = () => {
    setVideoLoaded(true);
  };

  const handleVideoError = () => {
    // If video fails to load, just keep the gradient background
    console.warn('Background video failed to load, using fallback background');
  };

  return (
    <div className="min-h-screen w-full relative">
      {/* Fallback gradient background - shows immediately */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/30 via-blue-900/20 to-indigo-900/30 z-[-2]"></div>
      
      {/* Background Video - loads lazily */}
      {showVideo && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={handleVideoLoad}
          onError={handleVideoError}
          className={`fixed inset-0 w-full h-full object-cover transition-opacity duration-700 ease-out ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          } z-[-1]`}
        >
          <source src="/142363-780562112.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Dark overlay for content readability */}
      <div className="fixed inset-0 bg-black/10 z-[-1]"></div>

      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className={`sticky top-0 z-50 w-full border-b bg-background/30 backdrop-blur-sm ${isDevicePage ? 'px-4 py-2 h-16' : ''}`}>
          <div className="container mx-auto flex items-center justify-between h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Logo size="md" />
              <h1 className="text-sm sm:text-xl font-eurostile-extended text-foreground hidden xs:block tracking-widest">
                DEVICE MANAGEMENT DASHBOARD
              </h1>
              <h1 className="text-sm font-eurostile-extended text-foreground xs:hidden tracking-widest">
                DMD
              </h1>
            </div>
            <div className="flex items-center">
              <UserAvatar />
            </div>
          </div>
        </header>
        
        {!isDevicePage && <Navigation />}
        
        <main className={`flex-1 container mx-auto px-2 sm:px-4 py-4 sm:py-8 ${isDevicePage ? 'pt-0' : ''}`}>
          <div className={`bg-background/60 backdrop-blur-sm ${isDevicePage ? 'rounded-t-lg' : 'rounded-lg'} p-3 sm:p-6 shadow-lg`}>
            <Outlet />
          </div>
        </main>
        <footer className="border-t bg-background/30 backdrop-blur-sm mt-8 sm:mt-16">
          <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              2025 Device Management Dashboard. All rights reserved.
              © 2025 Device Management Dashboard. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
