#!/usr/bin/env node

/**
 * Test System Alert Notification
 * 
 * Purpose: ทดสอบการส่ง system alert notification ผ่าน tRPC API
 * Usage: node scripts/test-system-alert.mjs [severity]
 * Example: node scripts/test-system-alert.mjs warning
 */

const API_URL = process.env.API_URL || 'http://localhost:3001/api/trpc';
const severity = process.argv[2] || 'info';

// Validate severity
if (!['info', 'warning', 'critical'].includes(severity)) {
  console.error('Invalid severity. Use: info, warning, or critical');
  process.exit(1);
}

// Test data
const testAlerts = {
  info: {
    severity: 'info',
    title: 'System Health Check - Normal',
    content: 'All systems are operating normally. Memory: 45%, Disk: 60%, CPU: 30%'
  },
  warning: {
    severity: 'warning',
    title: 'System Health Warning',
    content: 'High resource usage detected. Memory: 85%, Disk: 75%. Please monitor closely.'
  },
  critical: {
    severity: 'critical',
    title: 'System Health Critical Alert',
    content: 'Critical resource usage! Memory: 95%, Disk: 90%. Immediate action required!'
  }
};

async function testSystemAlert() {
  try {
    console.log(`\n🧪 Testing System Alert Notification (${severity})\n`);
    console.log('Test Data:', JSON.stringify(testAlerts[severity], null, 2));
    
    // Note: This is a simplified test. In production, you would need:
    // 1. Valid authentication token/cookie
    // 2. Proper tRPC client setup
    // 3. Or use the tRPC endpoint directly with proper headers
    
    console.log('\n⚠️  Note: This script demonstrates the alert structure.');
    console.log('To actually send alerts, use the tRPC API from an authenticated session:');
    console.log('\nExample (from browser console or authenticated script):');
    console.log(`
const result = await trpc.notification.createSystemAlert.mutate({
  severity: '${severity}',
  title: '${testAlerts[severity].title}',
  content: '${testAlerts[severity].content}'
});
console.log('Alert sent:', result);
    `);
    
    console.log('\n✅ Test data prepared successfully');
    console.log('\nExpected behavior:');
    console.log('1. Notification created in database with correct type and priority');
    console.log('2. Real-time notification sent via Socket.io');
    console.log('3. Notification appears in notification dropdown with appropriate icon');
    console.log('4. Icon colors:');
    console.log('   - INFO: Blue (ℹ️)');
    console.log('   - WARNING: Orange (⚠️)');
    console.log('   - CRITICAL: Red (🔺)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run test
testSystemAlert();
