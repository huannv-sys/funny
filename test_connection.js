/**
 * Test script to verify the connection to a MikroTik device (CommonJS version)
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

console.log(`Attempting to connect to MikroTik device at ${host}...`);

// Create connection
const api = new RouterOSAPI({
  host: host,
  user: user,
  password: pass,
  port: 8728,
  timeout: 5000,
});

// Attempt to connect
api.connect()
  .then(() => {
    console.log('SUCCESS: Connected to MikroTik device!');
    
    // Test with a simple command (get device identity)
    return api.write('/system/identity/print')
      .then(data => {
        console.log('Device identity:', data[0].name);
        
        // Get interfaces
        return api.write('/interface/print')
          .then(interfaces => {
            console.log('Interfaces found:', interfaces.length);
            interfaces.slice(0, 3).forEach(iface => {
              console.log(`- ${iface.name} (${iface.type})`);
            });
            if (interfaces.length > 3) {
              console.log(`... and ${interfaces.length - 3} more`);
            }
            
            // Close connection
            return api.close()
              .then(() => {
                console.log('Connection closed');
                process.exit(0);
              });
          });
      });
  })
  .catch(err => {
    console.error('ERROR: Failed to connect:', err.message);
    process.exit(1);
  });