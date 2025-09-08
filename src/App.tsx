import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Layout } from "./components/Layout";
import { LoginPage } from "./pages/LoginPage";
import { WarningPage } from "./pages/WarningPage";
import { OverviewPage } from "./pages/OverviewPage";
import { DevicesPage } from "./pages/DevicesPage";
import DeviceDetailPage from "./pages/DeviceDetailPage";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes that require warning acknowledgment */}
            <Route path="/warning" element={
              <ProtectedRoute requireWarning={true}>
                <WarningPage />
              </ProtectedRoute>
            } />
            
            {/* Protected dashboard routes */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/overview" replace />} />
              <Route path="overview" element={<OverviewPage />} />
              <Route path="devices" element={<DevicesPage />} />
              <Route path="device/:victimId" element={<DeviceDetailPage />} />
            </Route>
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
