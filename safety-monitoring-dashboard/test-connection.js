// test-connection.js
const { Client } = require('pg');

// Use the connection string your teammate provided
const connectionString = 'postgresql://postgres:edgeInf2009@ppedetector-rds-db.ci9owh7ddycl.us-east-1.rds.amazonaws.com/ppevision';

const client = new Client({
  connectionString,
  // Try adding these options
  ssl: {
    rejectUnauthorized: false
  }
});

// Test the connection
async function testConnection() {
  try {
    console.log('Connecting to PostgreSQL...');
    await client.connect();
    console.log('Connection successful!');
    
    // Try a simple query
    const res = await client.query('SELECT NOW()');
    console.log('Query result:', res.rows[0]);
    
    await client.end();
  } catch (err) {
    console.error('Connection error:', err);
  }
}

testConnection();