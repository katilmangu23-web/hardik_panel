import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Mail, Lock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

// Sample email suggestions (you can replace with your actual data)
const emailSuggestions = [
  "krishnadabhi592@gmail.com",
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

  const handleVideoLoad = () => setVideoLoaded(true);
  const handleVideoError = () => console.warn('Background video failed to load on LoginPage');
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // 2FA states
  const [authStep, setAuthStep] = useState<'login' | 'enterBotId' | 'enterOtp'>('login');
  const [telegramId, setTelegramId] = useState('');
  const [botIdError, setBotIdError] = useState<string | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSentAt, setOtpSentAt] = useState<number | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [tempUserPayload, setTempUserPayload] = useState<any>(null);
  const [sendResponseInfo, setSendResponseInfo] = useState<string | null>(null);
  
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
    validatePassword(value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // If we're in a 2FA step, don't run the initial login flow when the form is submitted
    if (authStep !== 'login') {
      return;
    }
    
    if (!isValidEmail(email)) {
      alert("Please enter a valid email address");
      return;
    }

    if (!Object.values(passwordValidation).every(Boolean)) {
      alert("Please ensure all password requirements are met");
      return;
    }

    setIsLoading(true);

    // Simulate initial credential check (replace with real auth call)
    setTimeout(() => {
      const username = email.split('@')[0].replace(/[._]/g, ' ');
      // Save the payload until 2FA completes — don't call login() yet.
      setTempUserPayload({ email, username, isLoggedIn: true, rememberSession });
      setIsLoading(false);
      // Move to telegram id step for 2FA
      setAuthStep('enterBotId');
    }, 800);
  };

  // Send OTP to provided Telegram chat id using the configured bot token
  const sendOtpToTelegram = async (chatId: string) => {
    // clear previous errors
    setBotIdError(null);
    setSendResponseInfo(null);

    const token = "7989812948:AAE84-5AZVYA2ufsNr6yxMgGCYCX6qQczSw";

    if (!token) {
      setBotIdError('Bot token not configured on the client. Ask admin to configure VITE_TELEGRAM_BOT_TOKEN.');
      return;
    }

    if (!chatId || chatId.trim().length === 0) {
      setBotIdError('Please enter a valid Telegram chat id.');
      return;
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    setGeneratedOtp(otp);
    setIsSendingOtp(true);
    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      const body = { chat_id: chatId, text: `Your login OTP is: ${otp}` };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || !data.ok) {
        const description = data?.description || `HTTP ${res.status}`;
        setBotIdError(`Failed to send OTP: ${description}`);
        return;
      }
      setOtpSentAt(Date.now());
      setSendResponseInfo('OTP sent. Check your Telegram.');
      setAuthStep('enterOtp');
    } catch (err: any) {
      setBotIdError(err?.message || 'Failed to send OTP');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyOtpAndFinish = async () => {
    setIsVerifyingOtp(true);
    try {
      // Simple synchronous verification (client-side generated). In production,
      // verification must happen server-side.
      setOtpError(null);
      if (generatedOtp && otpInput.trim() === generatedOtp) {
        // complete login
        if (tempUserPayload) {
          login(tempUserPayload);
        }
        // redirect to home
        navigate('/');
      } else {
        setOtpError('Invalid or expired OTP. Please try again or resend.');
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Clear messages/errors appropriately when switching between steps
  useEffect(() => {
    if (authStep === 'enterBotId') {
      // When showing the chat id input, clear any previous OTP-related messages
      setSendResponseInfo(null);
      setOtpError(null);
      // keep botIdError cleared only when user returns to edit
      // (botIdError will also be cleared on input change)
    }

    if (authStep === 'enterOtp') {
      // When showing OTP input, clear previous otp error so user sees a fresh state
      setOtpError(null);
      // keep sendResponseInfo so user can see confirmation that OTP was sent
      setBotIdError(null);
    }

    if (authStep === 'login') {
      // clear 2FA related messages when returning to initial login
      setBotIdError(null);
      setOtpError(null);
      setSendResponseInfo(null);
    }
  }, [authStep]);

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

          {/* Login / 2FA Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Login Step */}
            {authStep === 'login' && (
              <>
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
              </>
            )}

            {/* Enter Telegram Bot ID Step */}
            {authStep === 'enterBotId' && (
              <div className="space-y-4">
                <label className="block text-white/90 text-sm font-medium">Telegram Chat ID</label>
                <Input
                  value={telegramId}
                  onChange={(e) => { setTelegramId(e.target.value); setBotIdError(null); }}
                  onFocus={() => {
                    // clear send success/info and bot errors when user focuses the chat id field
                    setSendResponseInfo(null);
                    setBotIdError(null);
                  }}
                  placeholder="Enter your Telegram chat id"
                  className="bg-black/50 border-white/40 text-[#00ffff]/90"
                />
                {botIdError && <div className="text-red-500 text-sm">{botIdError}</div>}
                <div className="flex gap-2">
                  <Button type="button" onClick={() => sendOtpToTelegram(telegramId)} disabled={isSendingOtp || !telegramId}>{isSendingOtp ? 'Sending...' : 'Send OTP'}</Button>
                  <Button type="button" variant="ghost" onClick={() => { setAuthStep('login'); setTempUserPayload(null); setBotIdError(null); setSendResponseInfo(null); setOtpError(null); }}>Cancel</Button>
                </div>
                {sendResponseInfo && <div className="text-green-500 text-sm">{sendResponseInfo}</div>}
              </div>
            )}

            {/* Enter OTP Step */}
            {authStep === 'enterOtp' && (
              <div className="space-y-4">
                <label className="block text-white/90 text-sm font-medium">Enter OTP</label>
                <Input
                  value={otpInput}
                  onChange={(e) => { setOtpInput(e.target.value); setOtpError(null); }}
                  onFocus={() => {
                    // clear previous otp error when user focuses the OTP input
                    setOtpError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      // Prevent the form submit from running the initial login flow
                      e.preventDefault();
                      // Trigger OTP verification when user presses Enter
                      verifyOtpAndFinish();
                    }
                  }}
                  placeholder="6-digit OTP"
                  className="bg-black/50 border-white/40 text-[#00ffff]/90"
                />
                {otpError && <div className="text-red-500 text-sm">{otpError}</div>}
                <div className="flex gap-2">
                  <Button type="button" onClick={verifyOtpAndFinish} disabled={isVerifyingOtp || !otpInput}>{isVerifyingOtp ? 'Verifying...' : 'Verify & Continue'}</Button>
                  <Button type="button" variant="ghost" onClick={() => { setAuthStep('enterBotId'); setOtpError(null); setSendResponseInfo(null); setBotIdError(null); }}>Back</Button>
                  <Button type="button" variant="outline" onClick={() => { setOtpError(null); setBotIdError(null); setSendResponseInfo(null); sendOtpToTelegram(telegramId); }} disabled={isSendingOtp}>Resend OTP</Button>
                </div>
                <div className="text-xs text-white/60">OTP will expire in 5 minutes.</div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
