import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Link, CheckCircle, AlertCircle } from "lucide-react";

interface TelegramConnectProps {
  email: string;
  onConnected: (chatId: string) => void;
}

export function TelegramConnect({ email, onConnected }: TelegramConnectProps) {
  const [chatId, setChatId] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Validate chat ID format (should be numeric)
  const isValidChatId = (id: string) => {
    return /^\d+$/.test(id) && id.length > 0;
  };

  // Handle connecting to Telegram
  const handleConnect = async () => {
    if (!isValidChatId(chatId)) {
      setError("Please enter a valid Telegram Chat ID (numbers only)");
      return;
    }

    setIsConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      // Call link-token endpoint to connect user
      const response = await fetch('/.netlify/functions/telegram-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'linkUser',
          email: email,
          chat_id: chatId
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Telegram account connected successfully!");
        setTimeout(() => {
          onConnected(chatId);
        }, 1000);
      } else {
        setError(data.message || "Failed to connect Telegram account");
      }
    } catch (error) {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-[#00ffff]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Link className="w-8 h-8 text-[#00ffff]" />
        </div>
        <h2 className="text-xl font-eurostile-extended text-white mb-2">
          CONNECT TELEGRAM
        </h2>
        <p className="text-[#00ffff]/80 text-sm">
          Telegram OTP verification is <span className="text-red-400 font-bold">MANDATORY</span> for login
        </p>
      </div>

      {/* Status Bar */}
      <div className="bg-black/30 border border-white/20 rounded-lg p-3 font-mono text-xs">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[#00ffff]/80">EMAIL:</span>
          <span className="text-white/90">{email}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/90">BOT:</span>
          <span className="text-green-400/80">@otpdebot</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/90">STATUS:</span>
          <span className="text-yellow-400/80">PENDING_CONNECTION</span>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MessageCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-100">
            <p className="font-medium mb-2">How to get your Chat ID:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Open Telegram and search for <code className="bg-blue-800/50 px-1 rounded">@otpdebot</code></li>
              <li>Start a conversation with the bot</li>
              <li>Send <code className="bg-blue-800/50 px-1 rounded">/start</code> command</li>
              <li>Copy your Chat ID from the response or use @userinfobot</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Chat ID Input */}
      <div>
        <label htmlFor="chatId" className="block text-white/90 text-sm font-medium mb-2">
          TELEGRAM_CHAT_ID
        </label>
        <Input
          id="chatId"
          type="text"
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Enter your Telegram Chat ID"
          className="bg-black/50 border-white/40 text-[#00ffff]/90 placeholder:text-gray-500 focus:border-white/60 focus:ring-white/10"
        />
        
        <Button
          onClick={handleConnect}
          disabled={!isValidChatId(chatId) || isConnecting}
          className="w-full mt-3 bg-[#00ffff] hover:bg-[#00e6e6] text-black font-eurostile-extended font-bold py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
              CONNECTING...
            </div>
          ) : (
            "CONNECT TELEGRAM"
          )}
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span className="text-green-200 text-sm">{success}</span>
        </div>
      )}

    </div>
  );
}
