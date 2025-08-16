import { USER_NAME } from '@/data/db';
import { GaugeIcon } from '@/components/ui/gauge-icon';

export function Header() {
  const firstLetter = USER_NAME.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md animate-fade-in">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <GaugeIcon className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">Device Management Dashboard</h1>
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
            <span className="text-sm font-semibold text-white">{firstLetter}</span>
          </div>
          <span className="text-sm text-muted-foreground hidden sm:block">{USER_NAME}</span>
        </div>
      </div>
    </header>
  );
}