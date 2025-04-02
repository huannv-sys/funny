/**
 * Advanced test script to verify the connection to a MikroTik device (CommonJS version)
 * This script tries multiple ports and provides detailed error information
 */

const { RouterOSAPI } = require('routeros-api');

// Get connection details from environment variables
const host = process.env.MIKROTIK_HOST;
const user = process.env.MIKROTIK_USER;
const pass = process.env.MIKROTIK_PASS;

if (!host || !user || !pass) {
  console.error('ERROR: Missing environment variables');
  console.error('Please set MIKROTIK_HOST, MIKROTIK_USER, and MIKROTIK_PASS');
  process.exit(1);
}

console.log('======== MikroTik Connection Test ========');
console.log(`Host: ${host}`);
console.log(`User: ${user}`);
console.log(`Password: ${'*'.repeat(pass.length)}`);
console.log('==========================================');

// Try both API ports (standard and SSL)
const ports = [8728, 8729];
let connectionAttempts = 0;
let success = false;

// Function to try connecting with a specific port
async function tryConnect(port) {
  console.log(`\nAttempting to connect on port ${port}...`);
  connectionAttempts++;
  
  // Create connection
  const api = new RouterOSAPI({
    host: host,
    user: user,
    password: pass,
    port: port,
    timeout: 5000,
  });
  
  try {
    await api.connect();
    console.log(`SUCCESS: Connected to MikroTik device on port ${port}!`);
    
    // Test with a simple command
    console.log('Testing command execution...');
    const identityData = await api.write('/system/identity/print');
    console.log('Device identity:', identityData[0].name);
    
    // Get interfaces
    console.log('Retrieving interfaces...');
    const interfaces = await api.write('/interface/print');
    console.log(`Found ${interfaces.length} interfaces:`);
    interfaces.slice(0, 3).forEach(iface => {
      console.log(`- ${iface.name} (${iface.type || 'unknown type'})`);
    });
    if (interfaces.length > 3) {
      console.log(`... and ${interfaces.length - 3} more`);
    }
    
    // Close connection
    await api.close();
    console.log('Connection closed successfully');
    
    success = true;
    return true;
  } catch (err) {
    console.error(`ERROR on port ${port}:`, err.message);
    if (err.stack) {
      console.error(`Stack trace: ${err.stack}`);
    }
    
    try {
      await api.close();
    } catch (e) {
      // Ignore close errors
    }
    
    return false;
  }
}

// Try both ports sequentially
async function runTests() {
  for (const port of ports) {
    const result = await tryConnect(port);
    if (result) {
      break;
    }
  }
  
  console.log('\n======== Connection Test Results ========');
  console.log(`Attempted ${connectionAttempts} connection(s)`);
  console.log(`Status: ${success ? 'SUCCESS' : 'FAILURE'}`);
  console.log('==========================================');
  
  process.exit(success ? 0 : 1);
}

// Run the tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});