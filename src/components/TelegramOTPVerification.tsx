import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Shield, Clock, AlertCircle } from "lucide-react";
import { telegramService } from "@/lib/telegramService";

interface TelegramOTPVerificationProps {
  email: string;
  chatId: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
}

export function TelegramOTPVerification({ 
  email, 
  chatId,
  onVerificationSuccess, 
  onBack 
}: TelegramOTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);

  // Handle sending OTP
  const handleSendOTP = async () => {
    setIsSendingOTP(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await telegramService.sendOTP(chatId, email);
      
      if (result.success) {
        setSuccess("OTP sent successfully! Check your Telegram chat.");
        setOtpSent(true);
      } else {
        setError(result.message || "Failed to send OTP");
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsSendingOTP(false);
    }
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await telegramService.verifyOTP(otp, chatId);
      
      if (result.success) {
        setSuccess("OTP verified successfully!");
        setTimeout(() => {
          onVerificationSuccess();
        }, 1000);
      } else {
        setError(result.message || "Invalid OTP code");
      }
    } catch (error) {
      setError("Error verifying OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = () => {
    setOtpSent(false);
    setOtp("");
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-[#00ffff]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-8 h-8 text-[#00ffff]" />
        </div>
        <h2 className="text-xl font-eurostile-extended text-white mb-2">
          TELEGRAM VERIFICATION
        </h2>
        <p className="text-[#00ffff]/80 text-sm">
          Complete your login with Telegram OTP
        </p>
        <p className="text-xs text-white/50 mt-1">v2.0 - Single Chat ID Flow</p>
      </div>

      {/* Status Bar */}
      <div className="bg-black/30 border border-white/20 rounded-lg p-3 font-mono text-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[#00ffff]/80">EMAIL:</span>
          <span className="text-white/90">{email}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/90">CHAT_ID:</span>
          <span className="text-green-400/80">{chatId}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/90">BOT:</span>
          <span className="text-green-400/80">{telegramService.getBotUsername()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/90">STATUS:</span>
          <span className="text-yellow-400/80">
            {otpSent ? "OTP_SENT" : "PENDING"}
          </span>
        </div>
      </div>

      {/* Connection Status */}
      <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-100">
            <p className="font-medium mb-2">✅ Telegram Connected Successfully!</p>
            <p className="text-xs">Your Chat ID <code className="bg-green-800/50 px-1 rounded">{chatId}</code> is linked to your account. You'll receive OTP codes in your Telegram chat.</p>
          </div>
        </div>
      </div>

      {/* Send OTP Button */}
      {!otpSent && (
        <Button
          onClick={handleSendOTP}
          disabled={isSendingOTP}
          className="w-full bg-[#00ffff] hover:bg-[#00e6e6] text-black font-eurostile-extended font-bold py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSendingOTP ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              SENDING...
            </div>
          ) : (
            "SEND OTP"
          )}
        </Button>
      )}

      {/* OTP Input */}
      {otpSent && (
        <div>
          <label htmlFor="otp" className="block text-white/90 text-sm font-medium mb-2">
            OTP_CODE
          </label>
          <Input
            id="otp"
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="Enter 6-digit OTP"
            className="bg-black/50 border-white/40 text-[#00ffff]/90 placeholder:text-gray-500 focus:border-white/60 focus:ring-white/10 text-center text-lg tracking-widest"
            maxLength={6}
          />
          
          {/* OTP Timer */}
          <div className="flex items-center justify-center mt-2 text-xs text-white/60">
            <Clock className="w-3 h-3 mr-1" />
            <span>OTP expires in 5 minutes</span>
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6 || isLoading}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-eurostile-extended font-bold py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  VERIFYING...
                </div>
              ) : (
                "VERIFY OTP"
              )}
            </Button>
            
            <Button
              onClick={handleResendOTP}
              variant="outline"
              className="border-white/40 text-white hover:bg-white/10"
            >
              RESEND
            </Button>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
          <Shield className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-green-200 text-sm">{success}</span>
        </div>
      )}

      {/* Back Button */}
      <Button
        onClick={onBack}
        variant="outline"
        className="w-full border-white/40 text-white hover:bg-white/10"
      >
        ← BACK TO LOGIN
      </Button>
    </div>
  );
}
