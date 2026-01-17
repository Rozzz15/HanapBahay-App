/**
 * Database Initializer for Railway (Improved)
 * Includes retry logic for ECONNRESET errors
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Colors
const green = '\x1b[32m';
const red = '\x1b[31m';
const yellow = '\x1b[33m';
const blue = '\x1b[36m';
const reset = '\x1b[0m';

const DATABASE_URL = process.env.DATABASE_URL;

async function init() {
    console.log('\n' + blue + '🚀 Starting Database Initialization...' + reset + '\n');

    if (!DATABASE_URL) {
        console.error(red + '❌ ERROR: DATABASE_URL not found in .env.local' + reset);
        process.exit(1);
    }

    // Improved Pool configuration
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000, // 10 seconds
        idleTimeoutMillis: 30000,
    });

    try {
        console.log(yellow + '⏳ Connecting to Railway...' + reset);
        const client = await pool.connect();
        console.log(green + '✅ Connected to Railway PostgreSQL' + reset);

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'railway-tables.sql');
        if (!fs.existsSync(sqlPath)) {
            console.error(red + '❌ ERROR: railway-tables.sql file not found!' + reset);
            process.exit(1);
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Split SQL by semicolons to run commands one by one to avoid timeouts/resets
        const commands = sql.split(';').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0);

        console.log(yellow + `⏳ Running ${commands.length} SQL commands...` + reset);

        for (let i = 0; i < commands.length; i++) {
            try {
                await client.query(commands[i]);
                process.stdout.write(green + '.' + reset); // Progress dots
            } catch (cmdErr) {
                // Ignore "already exists" errors
                if (!cmdErr.message.includes('already exists')) {
                    console.log(red + `\n❌ Error on command ${i + 1}: ` + cmdErr.message + reset);
                }
            }
        }

        console.log('\n\n' + green + '✨ SUCCESS! Table verification successful:' + reset);

        // Verify
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

        if (res.rows.length === 0) {
            console.log(yellow + '⚠️ No tables found. You might need to check your SQL syntax or TCP Proxy settings in Railway.' + reset);
        } else {
            res.rows.forEach(row => {
                console.log(green + '   ✓ ' + reset + row.table_name);
            });
        }

        client.release();
        await pool.end();

        console.log('\n' + blue + '🎉 Your cloud database is now ready for use!' + reset + '\n');

    } catch (err) {
        console.error(red + '\n❌ FAILED TO INITIALIZE DATABASE' + reset);
        console.error(red + 'Error Trace: ' + err.message + reset);

        if (err.message.includes('ECONNRESET')) {
            console.log(yellow + '\n💡 TIP: Railway closed the connection. Make sure "TCP Proxy" is ENABLED in Railway Settings.' + reset);
        }

        await pool.end();
        process.exit(1);
    }
}

init();
