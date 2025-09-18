// Use built-in fetch (available in Node.js 18+)

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
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
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const update = JSON.parse(event.body);
    
    // Handle different types of updates
    if (update.message) {
      await handleMessage(update.message);
    } else if (update.callback_query) {
      await handleCallbackQuery(update.callback_query);
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ok: true }),
    };

  } catch (error) {
    console.error('Webhook Error:', error);
    
    return {
      statusCode: 200, // Always return 200 to Telegram to avoid retries
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ok: true }),
    };
  }
};

// Handle incoming messages
async function handleMessage(message) {
  const chatId = message.chat.id;
  const text = message.text;
  const username = message.from.username || message.from.first_name;

  console.log(`Received message from ${username} (${chatId}): ${text}`);

  // Handle /start command
  if (text === '/start') {
    await sendMessage(chatId, `🔐 Welcome to Device Management Dashboard Bot!\n\n` +
      `Your Chat ID is: \`${chatId}\`\n\n` +
      `To use this bot for OTP verification:\n` +
      `1. Go to https://hardik-mangu-panel.netlify.app\n` +
      `2. Enter your email and password\n` +
      `3. Enter this Chat ID: \`${chatId}\`\n` +
      `4. You'll receive OTP codes here for login verification\n\n` +
      `Type /help for more commands.`);
  }
  // Handle /help command
  else if (text === '/help') {
    await sendMessage(chatId, `🤖 Bot Commands:\n\n` +
      `/start - Get your Chat ID and setup instructions\n` +
      `/help - Show this help message\n` +
      `/status - Check bot status\n\n` +
      `This bot is used for OTP verification on the Device Management Dashboard.`);
  }
  // Handle /status command
  else if (text === '/status') {
    await sendMessage(chatId, `✅ Bot is online and working!\n\n` +
      `Your Chat ID: \`${chatId}\`\n` +
      `Username: @${username}\n` +
      `Ready to receive OTP codes.`);
  }
  // Handle any other message
  else {
    await sendMessage(chatId, `👋 Hello ${username}!\n\n` +
      `I'm the OTP verification bot for Device Management Dashboard.\n\n` +
      `Type /start to get your Chat ID and setup instructions.\n` +
      `Type /help for available commands.`);
  }
}

// Handle callback queries (for inline keyboards)
async function handleCallbackQuery(callbackQuery) {
  const chatId = callbackQuery.message.chat.id;
  const data = callbackQuery.data;

  console.log(`Received callback query: ${data}`);

  // Answer the callback query
  await answerCallbackQuery(callbackQuery.id, "Processing...");

  // Handle different callback data
  switch (data) {
    case 'get_chat_id':
      await sendMessage(chatId, `Your Chat ID is: \`${chatId}\``);
      break;
    default:
      await sendMessage(chatId, "Unknown command. Type /help for available commands.");
  }
}

// Send message to Telegram
async function sendMessage(chatId, text, parseMode = 'Markdown') {
  try {
    const response = await fetch(`https://api.telegram.org/bot8414881689:AAEusiQ1UbHgRr4QDgB7PR2OLOYsJ2s7nvk/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
      })
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Failed to send message:', data);
    }
    
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

// Answer callback query
async function answerCallbackQuery(callbackQueryId, text) {
  try {
    const response = await fetch(`https://api.telegram.org/bot8414881689:AAEusiQ1UbHgRr4QDgB7PR2OLOYsJ2s7nvk/answerCallbackQuery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text
      })
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error answering callback query:', error);
    throw error;
  }
}
