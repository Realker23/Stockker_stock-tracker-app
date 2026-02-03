/**
 * Database Connection Test Script
 * 
 * This script tests the MongoDB connection to ensure it's working properly.
 * Run with: node test-db.js
 */

require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || '';

/**
 * Attempts to connect to MongoDB using the MONGODB_URI environment variable, reports connection details, performs a simple collection listing, and closes the connection.
 *
 * Logs a masked form of the connection URI and connection diagnostics; if MONGODB_URI is missing or the connection fails, the process exits with status 1. On completion (success or failure), the Mongoose connection is closed.
 */
async function testConnection() {
  console.log('🔍 Testing MongoDB connection...\n');

  // Check if URI is provided
  if (!MONGODB_URI) {
    console.error('❌ ERROR: MONGODB_URI is not defined in .env');
    console.log('Please create a .env file with your MongoDB connection string.');
    process.exit(1);
  }

  // Mask the URI for security (show only first and last few characters)
  const maskedUri = MONGODB_URI.length > 20 
    ? `${MONGODB_URI.substring(0, 15)}...${MONGODB_URI.substring(MONGODB_URI.length - 10)}`
    : '***';
  console.log(`📝 Connection URI: ${maskedUri}\n`);

  try {
    console.log('⏳ Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { bufferCommands: false });
    
    console.log('✅ Connection successful!');
    console.log(`📦 Database: ${mongoose.connection.name}`);
    console.log(`🌐 Host: ${mongoose.connection.host}`);
    console.log(`🔌 Port: ${mongoose.connection.port}`);
    console.log(`📊 Ready State: ${mongoose.connection.readyState} (1 = connected)`);
    
    // Test a simple operation
    console.log('\n🧪 Testing database operations...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`📚 Collections found: ${collections.length}`);
    if (collections.length > 0) {
      console.log('   Collections:', collections.map(c => c.name).join(', '));
    }
    
    console.log('\n✨ All tests passed! Your database connection is working properly.\n');
    
  } catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error details:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 Tip: Check your username and password in the connection string.');
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('\n💡 Tip: Check your MongoDB cluster URL and network connection.');
    } else if (error.message.includes('timeout')) {
      console.log('\n💡 Tip: Check your IP whitelist in MongoDB Atlas settings.');
    }
    
    process.exit(1);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔒 Connection closed.');
  }
}

// Run the test
testConnection();