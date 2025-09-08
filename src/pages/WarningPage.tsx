import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Info, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";

export function WarningPage() {
  const navigate = useNavigate();
  const { acknowledgeWarning, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  // Background video handling (same as overview/device pages)
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setShowVideo(true);
    const timer = setTimeout(() => {
      if (videoRef.current) videoRef.current.load();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleVideoLoad = () => setVideoLoaded(true);
  const handleVideoError = () => {
    console.warn('Background video failed to load on WarningPage');
  };

  const handleAcknowledge = () => {
    setIsLoading(true);
    
    // Simulate processing
    setTimeout(() => {
      // Require authentication before acknowledging
      if (!isAuthenticated) {
        // If user is not logged in, send them to login first
        navigate('/login', { replace: true });
        return;
      }

      // Use the auth hook to acknowledge warning
      acknowledgeWarning();
      
      // Navigate directly to overview page (main app)
      navigate('/overview', { replace: true });
    }, 1000);
  };

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {/* Fallback gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/30 via-blue-900/20 to-indigo-900/30 z-[-2]"></div>
      {/* Background Video (autoplay, loop, muted) */}
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
      {/* Dark overlay for readability */}
      <div className="fixed inset-0 bg-black/10 z-[-1]"></div>
      
      {/* Warning Card */}
      <div className="w-full max-w-2xl">
        <div className="bg-black/40 backdrop-blur-xl border border-[#00ffff]/20 rounded-2xl p-8 shadow-2xl shadow-[#00ffff]/10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-4 mb-4">
              <AlertTriangle className="w-8 h-8 text-[#00ffff]/80" />
              <h1 className="text-2xl font-eurostile-extended text-white" style={{ textShadow: '0 0 5px rgba(0, 255, 255, 0.3)' }}>
                Warning: Authorized Use Only
              </h1>
              <AlertTriangle className="w-8 h-8 text-[#00ffff]/80" />
            </div>
          </div>

          {/* Warning Content */}
          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#00ffff]/20 rounded-full flex items-center justify-center mt-0.5">
                <Info className="w-4 h-4 text-[#00ffff]/80" />
              </div>
              <p className="text-gray-300 font-mono text-sm leading-relaxed" style={{ fontFamily: 'monospace' }}>
                This application is designed for monitoring Android applications and is strictly intended for use by law enforcement agencies and legal purposes only.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#00ffff]/20 rounded-full flex items-center justify-center mt-0.5">
                <Info className="w-4 h-4 text-[#00ffff]/80" />
              </div>
              <p className="text-gray-300 font-mono text-sm leading-relaxed" style={{ fontFamily: 'monospace' }}>
                Any misuse, unauthorized access, or illegal activity using this application is strictly prohibited.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#00ffff]/20 rounded-full flex items-center justify-center mt-0.5">
                <Info className="w-4 h-4 text-[#00ffff]/80" />
              </div>
              <p className="text-gray-300 font-mono text-sm leading-relaxed" style={{ fontFamily: 'monospace' }}>
                If you choose to use this application for any unlawful activities, you bear full responsibility for your actions.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-[#00ffff]/20 rounded-full flex items-center justify-center mt-0.5">
                <Info className="w-4 h-4 text-[#00ffff]/80" />
              </div>
              <p className="text-gray-300 font-mono text-sm leading-relaxed" style={{ fontFamily: 'monospace' }}>
                The developers and providers of this application hold no liability for any misuse.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={handleAcknowledge}
              disabled={isLoading}
              className="flex-1 bg-[#00ffff] hover:bg-[#00e6e6] text-black font-eurostile-extended font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-[#00ffff]/30 disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                  PROCESSING...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 mr-2 bg-[#00ffff] rounded-lg flex items-center justify-center">
                    <span className="text-black font-mono font-bold text-sm">&gt;_</span>
                  </div>
                  I UNDERSTAND & ACCEPT
                </div>
              )}
            </Button>
          </div>

          {/* Footer Note */}
          <div className="text-center mt-6">
            <p className="text-[#00ffff]/60 font-mono text-xs" style={{ fontFamily: 'monospace' }}>
              By clicking "I UNDERSTAND & ACCEPT", you acknowledge that you have read and understood these terms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
