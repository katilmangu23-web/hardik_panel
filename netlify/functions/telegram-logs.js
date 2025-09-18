// Telegram OTP Service Logs
// This function provides logging and monitoring for Telegram OTP operations

exports.handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-dashboard-new.netlify.app',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const { action, limit = 50, startDate, endDate } = JSON.parse(event.body || '{}');

    // Get logs based on action
    if (action === 'getLogs') {
      return await getTelegramLogs(limit, startDate, endDate);
    } else if (action === 'getStats') {
      return await getTelegramStats();
    } else if (action === 'clearLogs') {
      return await clearTelegramLogs();
    } else {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': 'https://hardik-dashboard-new.netlify.app',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          success: false, 
          error: 'Invalid action. Use: getLogs, getStats, or clearLogs' 
        }),
      };
    }

  } catch (error) {
    console.error('Telegram Logs Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-dashboard-new.netlify.app',
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

// Get Telegram operation logs
async function getTelegramLogs(limit, startDate, endDate) {
  try {
    // In a real implementation, you would query a database
    // For now, we'll return mock data showing the structure
    const logs = [
      {
        id: 'log_001',
        timestamp: new Date().toISOString(),
        action: 'sendOTP',
        email: 'user@example.com',
        chatId: '123456789',
        status: 'success',
        message: 'OTP sent successfully',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: 'log_002',
        timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        action: 'verifyOTP',
        email: 'user@example.com',
        chatId: '123456789',
        status: 'success',
        message: 'OTP verified successfully',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: 'log_003',
        timestamp: new Date(Date.now() - 600000).toISOString(), // 10 minutes ago
        action: 'linkUser',
        email: 'newuser@example.com',
        chatId: '987654321',
        status: 'success',
        message: 'User linked successfully',
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0...'
      },
      {
        id: 'log_004',
        timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
        action: 'sendOTP',
        email: 'test@example.com',
        chatId: '555666777',
        status: 'failed',
        message: 'Failed to send OTP via Telegram',
        ip: '192.168.1.102',
        userAgent: 'Mozilla/5.0...'
      }
    ];

    // Filter by date range if provided
    let filteredLogs = logs;
    if (startDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(startDate));
    }
    if (endDate) {
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(endDate));
    }

    // Limit results
    filteredLogs = filteredLogs.slice(0, limit);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-dashboard-new.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        logs: filteredLogs,
        total: filteredLogs.length,
        message: 'Logs retrieved successfully'
      }),
    };

  } catch (error) {
    console.error('Error getting logs:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-dashboard-new.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to retrieve logs',
        description: error.message 
      }),
    };
  }
}

// Get Telegram service statistics
async function getTelegramStats() {
  try {
    const stats = {
      totalRequests: 1247,
      successfulRequests: 1189,
      failedRequests: 58,
      successRate: 95.3,
      averageResponseTime: 1.2,
      last24Hours: {
        requests: 89,
        successful: 85,
        failed: 4
      },
      topActions: [
        { action: 'sendOTP', count: 623 },
        { action: 'verifyOTP', count: 589 },
        { action: 'linkUser', count: 35 }
      ],
      topUsers: [
        { email: 'admin@example.com', requests: 45 },
        { email: 'user1@example.com', requests: 32 },
        { email: 'user2@example.com', requests: 28 }
      ],
      lastUpdated: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-dashboard-new.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        stats: stats,
        message: 'Statistics retrieved successfully'
      }),
    };

  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-dashboard-new.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to retrieve statistics',
        description: error.message 
      }),
    };
  }
}

// Clear old logs (admin function)
async function clearTelegramLogs() {
  try {
    // In a real implementation, you would delete old logs from database
    // For now, we'll just return success
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-dashboard-new.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        message: 'Logs cleared successfully',
        clearedCount: 150 // Mock number
      }),
    };

  } catch (error) {
    console.error('Error clearing logs:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': 'https://hardik-dashboard-new.netlify.app',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        success: false, 
        error: 'Failed to clear logs',
        description: error.message 
      }),
    };
  }
}
