const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function setupDatabase() {
  // First, connect to PostgreSQL without specifying a database
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if database exists, create if not
    const dbName = process.env.DB_NAME;
    const checkDbQuery = `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`;
    const result = await client.query(checkDbQuery);

    if (result.rows.length === 0) {
      console.log(`Database '${dbName}' does not exist. Creating...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database '${dbName}' created successfully`);
    } else {
      console.log(`Database '${dbName}' already exists`);
    }

    await client.end();

    // Now connect to the specific database and run migrations
    const dbClient = new Client({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
    });

    await dbClient.connect();
    console.log(`Connected to database '${dbName}'`);

    // Read and execute the init.sql file
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Running database migrations...');
    await dbClient.query(sql);
    console.log('✅ All tables created successfully!');

    await dbClient.end();
    console.log('Database setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();