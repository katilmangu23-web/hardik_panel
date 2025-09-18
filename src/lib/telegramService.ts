// Telegram OTP Service
// This service handles sending and verifying OTP codes via Telegram bot

interface TelegramOTPResponse {
  success: boolean;
  message?: string;
  otpId?: string;
}

interface VerifyOTPResponse {
  success: boolean;
  message?: string;
}

class TelegramService {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    // Only work on the deployed site
    if (typeof window !== 'undefined' && window.location.hostname !== 'hardik-dashboard-new.netlify.app') {
      throw new Error('Telegram OTP service is only available on the production site');
    }
    
    this.botToken = '8414881689:AAEusiQ1UbHgRr4QDgB7PR2OLOYsJ2s7nvk';
    this.baseUrl = '/.netlify/functions/telegram-api';
  }

  // Generate a random 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP to Telegram chat using webhook system
  async sendOTP(chatId: string, email: string): Promise<TelegramOTPResponse> {
    try {
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sendOTP',
          email: email,
          chat_id: chatId
        })
      });

      const data = await response.json();

      if (data.success) {
        // Store email and chat ID for verification step
        const otpData = {
          email,
          chatId,
          timestamp: Date.now()
        };
        sessionStorage.setItem('telegram_otp', JSON.stringify(otpData));
        
        return {
          success: true,
          message: 'OTP sent successfully to your Telegram',
          otpId: data.otpId || Date.now().toString()
        };
      } else {
        return {
          success: false,
          message: data.message || data.error || 'Failed to send OTP'
        };
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Network error. Please check your internet connection.'
      };
    }
  }

  // Verify OTP code using webhook system
  async verifyOTP(enteredOTP: string, chatId: string): Promise<VerifyOTPResponse> {
    try {
      // Get email from session storage (stored during OTP request)
      const storedOTPData = sessionStorage.getItem('telegram_otp');
      let email = '';
      
      if (storedOTPData) {
        const otpData = JSON.parse(storedOTPData);
        email = otpData.email || '';
      }

      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verifyOTP',
          email: email,
          chat_id: chatId,
          otp: enteredOTP
        })
      });

      const data = await response.json();

      if (data.success) {
        // Clear the OTP from storage on successful verification
        sessionStorage.removeItem('telegram_otp');
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      } else {
        return {
          success: false,
          message: data.message || data.error || 'Invalid OTP code. Please try again.'
        };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Error verifying OTP. Please try again.'
      };
    }
  }

  // Check if service is available (only on production site)
  isAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'hardik-dashboard-new.netlify.app';
  }

  // Get bot username for display
  getBotUsername(): string {
    return '@otpdebot';
  }
}

export const telegramService = new TelegramService();
export default telegramService;
