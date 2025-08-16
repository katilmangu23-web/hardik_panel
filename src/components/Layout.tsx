import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Navigation } from './Navigation';

export function Layout() {
  return (
    <div className="min-h-screen w-full">
      <Header />
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t bg-background/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">© 2025 Device Management Dashboard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}