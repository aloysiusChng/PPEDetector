const pg = require('pg');
const client = new pg.Client({
  connectionString: 'postgresql://postgres:edgeInf2009@ppedetector-rds-db.ci9owh7ddycl.us-east-1.rds.amazonaws.com/ppevision',
  ssl: {
    rejectUnauthorized: false
  }
});

async function listTables() {
  try {
    await client.connect();
    console.log('Connection successful!');
    
    // Query to list all tables
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `);
    
    console.log('Tables in database:');
    res.rows.forEach(row => {
      console.log(`${row.table_schema}.${row.table_name}`);
    });
    
    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

listTables();