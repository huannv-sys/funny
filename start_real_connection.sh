#!/bin/bash

# Check for environment variables
if [ -z "$MIKROTIK_HOST" ] || [ -z "$MIKROTIK_USER" ] || [ -z "$MIKROTIK_PASS" ]; then
  echo "Error: Missing required environment variables"
  echo "Please set MIKROTIK_HOST, MIKROTIK_USER, and MIKROTIK_PASS"
  exit 1
fi

# Test connection first
echo "Testing connection to MikroTik device..."
node advanced_test_connection.cjs

# If connection test failed, exit
if [ $? -ne 0 ]; then
  echo "Connection test failed. Please check your settings and try again."
  exit 1
fi

echo "Connection successful! Starting application with real device..."

# Set environment variable to use real data
export USE_MOCK_DATA=false

# Start the application
npm run dev