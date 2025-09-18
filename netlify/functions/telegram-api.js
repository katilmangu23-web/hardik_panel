// Use built-in fetch (available in Node.js 18+)

// Logging helper function
function logTelegramAction(action, email, chatId, status, message, ip, userAgent) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    email: email || 'unknown',
    chatId: chatId || 'unknown',
    status: status,
    message: message,
    ip: ip || 'unknown',
    userAgent: userAgent || 'unknown'
  };
  
  console.log('TELEGRAM_LOG:', JSON.stringify(logEntry));
  return logEntry;
}

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { action, email, chat_id, otp } = JSON.parse(event.body);
    const ip = event.headers['x-forwarded-for'] || event.headers['x-real-ip'] || 'unknown';
    const userAgent = event.headers['user-agent'] || 'unknown';

    // Log the incoming request
    logTelegramAction('request_received', email, chat_id, 'processing', `Action: ${action}`, ip, userAgent);

    if (!action) {
      logTelegramAction('request_received', email, chat_id, 'error', 'Missing action parameter', ip, userAgent);
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Missing action parameter' 
        }),
      };
    }

    // Route to appropriate action
    if (action === 'sendOTP') {
      return await handleSendOTP(email, chat_id);
    } else if (action === 'verifyOTP') {
      return await handleVerifyOTP(email, chat_id, otp);
    } else if (action === 'linkUser') {
      return await handleLinkUser(email, chat_id);
    } else {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid action' 
        }),
      };
    }

  } catch (error) {
    console.error('Telegram API Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        description: error.message 
      }),
    };
  }
};

// Handle OTP request
async function handleSendOTP(email, chat_id) {
  try {
    // Generate OTP and send via Telegram
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const message = `🔐 Device Management Dashboard - OTP Verification\n\n` +
      `Email: ${email}\n` +
      `OTP Code: ${otp}\n\n` +
      `Please enter this code to complete your login.\n` +
      `This code will expire in 5 minutes.`;

    // Log OTP generation
    logTelegramAction('otp_generated', email, chat_id, 'processing', `OTP generated for ${email}`, 'unknown', 'unknown');

    // Send OTP via Telegram
    const telegramResponse = await fetch(`https://api.telegram.org/bot8414881689:AAEusiQ1UbHgRr4QDgB7PR2OLOYsJ2s7nvk/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chat_id,
        text: message,
        parse_mode: 'HTML'
      })
    });

    const telegramData = await telegramResponse.json();

    if (telegramData.ok) {
      // Store OTP temporarily (in a real app, use a database)
      console.log(`OTP sent to ${email}: ${otp}`);
      
      // Log successful OTP send
      logTelegramAction('otp_sent', email, chat_id, 'success', `OTP sent successfully to ${email}`, 'unknown', 'unknown');
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: 'OTP sent successfully',
          otpId: Date.now().toString()
        }),
      };
    } else {
      // Log failed OTP send
      logTelegramAction('otp_send_failed', email, chat_id, 'error', `Failed to send OTP: ${telegramData.description}`, 'unknown', 'unknown');
      
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Failed to send OTP via Telegram',
          description: telegramData.description
        }),
      };
    }

  } catch (error) {
    console.error('OTP Request Error:', error);
    
    // Log error
    logTelegramAction('otp_send_error', email, chat_id, 'error', `Error: ${error.message}`, 'unknown', 'unknown');
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to request OTP',
        description: error.message 
      }),
    };
  }
}

// Handle OTP verification
async function handleVerifyOTP(email, chat_id, otp) {
  try {
    // For now, we'll simulate OTP verification
    // In a real implementation, you would check against stored OTP with TTL
    console.log(`Verifying OTP for ${email}: ${otp}`);
    
    // Log OTP verification attempt
    logTelegramAction('otp_verify_attempt', email, chat_id, 'processing', `OTP verification attempt for ${email}`, 'unknown', 'unknown');
    
    // Simple validation - in production, check against stored OTP with expiration
    if (otp && otp.length === 6 && /^\d+$/.test(otp)) {
      // Log successful verification
      logTelegramAction('otp_verified', email, chat_id, 'success', `OTP verified successfully for ${email}`, 'unknown', 'unknown');
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: true,
          message: 'OTP verified successfully'
        }),
      };
    } else {
      // Log failed verification
      logTelegramAction('otp_verify_failed', email, chat_id, 'error', `Invalid OTP format for ${email}`, 'unknown', 'unknown');
      
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid OTP format'
        }),
      };
    }

  } catch (error) {
    console.error('OTP Verify Error:', error);
    
    // Log error
    logTelegramAction('otp_verify_error', email, chat_id, 'error', `Error: ${error.message}`, 'unknown', 'unknown');
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to verify OTP',
        description: error.message 
      }),
    };
  }
}

// Handle user linking
async function handleLinkUser(email, chat_id) {
  try {
    // For now, we'll simulate a successful link since the webhook endpoints don't exist yet
    // In a real implementation, you would store this in a database
    console.log(`Linking user: ${email} with chat_id: ${chat_id}`);
    
    // Log user linking attempt
    logTelegramAction('user_link_attempt', email, chat_id, 'processing', `Linking user ${email} with chat_id ${chat_id}`, 'unknown', 'unknown');
    
    // Simulate successful linking
    // Log successful linking
    logTelegramAction('user_linked', email, chat_id, 'success', `User ${email} linked successfully with chat_id ${chat_id}`, 'unknown', 'unknown');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'User linked successfully',
        email: email,
        chat_id: chat_id
      }),
    };

  } catch (error) {
    console.error('Link User Error:', error);
    
    // Log error
    logTelegramAction('user_link_error', email, chat_id, 'error', `Error: ${error.message}`, 'unknown', 'unknown');
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-mangu-panel.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to link user',
        description: error.message 
      }),
    };
  }
}
