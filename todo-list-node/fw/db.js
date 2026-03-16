const mysql = require('mysql2/promise');
const dbConfig = require('../config');

// Verbindung zur Datenbank herstellen
async function connectDB() {
    let retries = 5;
    while (retries > 0) {
        try {
            const connection = await mysql.createConnection(dbConfig);
            console.log('Database connected');
            return connection;
        } catch (error) {
            console.error(`Error connecting to database (retries left: ${retries}):`, error.message);
            retries--;
            if (retries === 0) {
                console.error('Max retries reached. Database connection failed.');
                return null;
            }
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s before retry
        }
    }
}

async function executeStatement(statement, params = []) {
    let conn = await connectDB();
    if (!conn) {
        throw new Error('Database connection could not be established.');
    }
    const [results, fields] = await conn.execute(statement, params);
    await conn.end(); // Close connection after use to prevent leaks
    return results;
}

module.exports = { connectDB: connectDB, executeStatement: executeStatement };