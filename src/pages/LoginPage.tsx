import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { TelegramOTPVerification } from "@/components/TelegramOTPVerification";
import { TelegramConnect } from "@/components/TelegramConnect";
import { telegramService } from "@/lib/telegramService";

// Sample email suggestions (you can replace with your actual data)
const emailSuggestions = [
  "rajupainter2222@gmail.com",
  "admin@company.com",
  "user@example.com",
  "test@domain.com",
  "support@help.com",
  "info@business.com",
  "contact@service.com",
  "sales@enterprise.com"
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberSession, setRememberSession] = useState(false);
  const [showPasswordHints, setShowPasswordHints] = useState(false);
  // Background video handling (same pattern as Layout)
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setShowVideo(true);
    const t = setTimeout(() => videoRef.current?.load(), 100);
    return () => clearTimeout(t);
  }, []);

  // Check if Telegram service is available
  useEffect(() => {
    setIsTelegramAvailable(telegramService.isAvailable());
  }, []);

  const handleVideoLoad = () => setVideoLoaded(true);
  const handleVideoError = () => console.warn('Background video failed to load on LoginPage');
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  
  // Telegram OTP state
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showTelegramConnect, setShowTelegramConnect] = useState(false);
  const [isTelegramAvailable, setIsTelegramAvailable] = useState(false);
  const [linkedChatId, setLinkedChatId] = useState<string | null>(null);
  
  // Email suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  
  // Password validation
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    digit: false,
    special: false
  });

  // Email validation
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password validation function
  const validatePassword = (password: string) => {
    setPasswordValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      digit: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    });
  };

  // Handle email input
  const handleEmailChange = (value: string) => {
    setEmail(value);
    
    if (value.length > 0) {
      const filtered = emailSuggestions.filter(suggestion => 
        suggestion.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle email suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setEmail(suggestion);
    setShowSuggestions(false);
  };

  // Handle password input
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setLoginError(null); // clear login error when user edits password
    validatePassword(value);
  };

  // Handle form submission (email + password + Telegram OTP)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // clear previous login error
    setLoginError(null);
    if (!isValidEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!Object.values(passwordValidation).every(Boolean)) {
      alert("Please ensure all password requirements are met");
      return;
    }

    // Enforce exact password match per requirement
    const requiredPassword = 'Mira@@1122';
    if (password !== requiredPassword) {
      setLoginError('Incorrect access code');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Proceed to Telegram connection (mandatory)
    setTimeout(() => {
      setIsLoading(false);
      setShowTelegramConnect(true);
    }, 800);
  };

  // Handle successful OTP verification
  const handleOTPSuccess = () => {
    const username = email.split('@')[0].replace(/[._]/g, ' ');
    login({ email, username, isLoggedIn: true, rememberSession });
    navigate('/');
  };

  // Handle successful Telegram connection
  const handleTelegramConnected = (chatId: string) => {
    setLinkedChatId(chatId);
    setShowTelegramConnect(false);
    setShowOTPVerification(true);
  };


  // Handle back from OTP verification
  const handleOTPBack = () => {
    setShowOTPVerification(false);
    setShowTelegramConnect(true);
    setLoginError(null);
  };

  // Removed Telegram send/verify functions

  // Removed 2FA step management effect

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center p-4">
      {/* Fallback gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900/30 via-blue-900/20 to-indigo-900/30 z-[-2]"></div>
      {/* Background Video */}
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
      
      {/* Login Card */}
      <div className="w-full max-w-md">
        <div className="bg-black/40 backdrop-blur-xl border border-[#00ffff]/20 rounded-2xl p-8 shadow-2xl shadow-[#00ffff]/10">
          {/* Logo Container */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-[#00ffff]/80 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-mono font-bold text-black">&gt;_</span>
            </div>
          </div>

          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-2xl font-eurostile-extended text-white mb-2 tracking-wider" style={{ textShadow: '0 0 5px rgba(0, 255, 255, 0.3)' }}>
              <div>DEVICE MANAGEMENT</div>
              <div>DASHBOARD</div>
            </div>
            <p className="text-[#00ffff]/80 font-mono text-sm">Access granted</p>
          </div>

          {/* Status Bar */}
          <div className="bg-black/30 border border-white/20 rounded-lg p-3 mb-6 font-mono text-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[#00ffff]/80">STATUS:</span>
              <span className="text-white/90">READY</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-white/90">CONNECTION:</span>
              <span className="text-green-400/80">SECURE</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-white/90">AUTH:</span>
              <span className="text-pink-400/80">PENDING</span>
            </div>
          </div>

          {/* Show appropriate step */}
          {showTelegramConnect ? (
            <TelegramConnect
              email={email}
              onConnected={handleTelegramConnected}
            />
          ) : showOTPVerification ? (
            <TelegramOTPVerification
              email={email}
              chatId={linkedChatId || ""}
              onVerificationSuccess={handleOTPSuccess}
              onBack={handleOTPBack}
            />
          ) : (
            <>
              {/* Login Form (email + password) */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {loginError && <div className="text-red-400 text-sm mb-2">{loginError}</div>}
                {/* Email Field */}
                <div className="relative">
                  <label htmlFor="email" className="block text-white/90 text-sm font-medium mb-2">EMAIL_ADDRESS</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onFocus={() => setShowSuggestions(email.length > 0 && filteredSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      placeholder="Enter your email"
                      className="pl-10 bg-black/50 border-white/40 text-[#00ffff]/90 placeholder:text-gray-500 focus:border-white/60 focus:ring-white/10"
                      required
                    />
                  </div>

                  {showSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-black/90 border border-[#00ffff]/30 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                      {filteredSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="px-3 py-2 hover:bg-[#00ffff]/20 cursor-pointer text-white/90 hover:text-white transition-colors"
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-white/90 text-sm font-medium mb-2">ACCESS_CODE</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      onFocus={() => setShowPasswordHints(true)}
                      onBlur={() => setShowPasswordHints(false)}
                      placeholder="Enter your password"
                      className="pl-10 bg-black/50 border-white/40 text-[#00ffff]/90 placeholder:text-gray-500 focus:border-white/60 focus:ring-white/10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/70 hover:text-white/90"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {showPasswordHints && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${passwordValidation.length ? 'bg-[#00ffff]' : 'bg-white/30'}`}></div>
                        <span className={`text-xs ${passwordValidation.length ? 'text-[#00ffff]' : 'text-white/50'}`}>At least 8 characters</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${passwordValidation.uppercase ? 'bg-[#00ffff]' : 'bg-white/30'}`}></div>
                        <span className={`text-xs ${passwordValidation.uppercase ? 'text-[#00ffff]' : 'text-white/50'}`}>At least 1 uppercase letter</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${passwordValidation.lowercase ? 'bg-[#00ffff]' : 'bg-white/30'}`}></div>
                        <span className={`text-xs ${passwordValidation.lowercase ? 'text-[#00ffff]' : 'text-white/50'}`}>At least 1 lowercase letter</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${passwordValidation.digit ? 'bg-[#00ffff]' : 'bg-white/30'}`}></div>
                        <span className={`text-xs ${passwordValidation.digit ? 'text-[#00ffff]' : 'text-white/50'}`}>At least 1 digit</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${passwordValidation.special ? 'bg-[#00ffff]' : 'bg-white/30'}`}></div>
                        <span className={`text-xs ${passwordValidation.special ? 'text-[#00ffff]' : 'text-white/50'}`}>At least 1 special character</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Remember Session */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberSession}
                    onCheckedChange={(checked) => setRememberSession(checked as boolean)}
                    className="border-white/40 data-[state=checked]:bg-[#00ffff]/80"
                  />
                  <label htmlFor="remember" className="text-white/90 text-sm">Remember session</label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#00ffff] hover:bg-[#00e6e6] text-black font-eurostile-extended font-bold py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg shadow-[#00ffff]/30 disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                      INITIALIZING...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 mr-2">
                        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                          <path d="M32 8L56 20V44L32 56L8 44V20L32 8Z" stroke="#00ffff" strokeWidth="2" fill="none" />
                          <path d="M20 32L44 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                          <path d="M32 20L32 44" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="20" cy="32" r="2" fill="white" />
                          <circle cx="44" cy="32" r="2" fill="white" />
                          <circle cx="32" cy="20" r="2" fill="white" />
                          <circle cx="32" cy="44" r="2" fill="white" />
                          <rect x="16" y="26" width="12" height="8" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
                          <rect x="17" y="27" width="10" height="6" rx="0.5" fill="white" />
                          <text x="22" y="31" fontSize="6" fill="black" textAnchor="middle" dominantBaseline="middle" fontFamily="monospace" fontWeight="bold">&lt;/&gt;</text>
                          <rect x="36" y="26" width="8" height="12" rx="1" stroke="white" strokeWidth="1.5" fill="none" />
                          <rect x="38" y="34" width="4" height="1" rx="0.5" fill="white" />
                          <path d="M26 26L38 26" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                          <path d="M26 38L38 38" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                          <circle cx="32" cy="8" r="2" fill="white" />
                          <circle cx="56" cy="20" r="2" fill="white" />
                          <circle cx="56" cy="44" r="2" fill="white" />
                          <circle cx="32" cy="56" r="2" fill="white" />
                          <circle cx="8" cy="44" r="2" fill="white" />
                          <circle cx="8" cy="20" r="2" fill="white" />
                        </svg>
                      </div>
                      INITIALIZE_ACCESS
                    </div>
                  )}
                </Button>
              </form>
              
              {/* Telegram Availability Notice */}
              {isTelegramAvailable && (
                <div className="mt-4 p-3 bg-[#00ffff]/10 border border-[#00ffff]/30 rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-[#00ffff]/90">
                    <div className="w-2 h-2 bg-[#00ffff] rounded-full animate-pulse"></div>
                    <span>Telegram OTP verification will be required after login</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
