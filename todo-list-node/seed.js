const db = require('./fw/db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('[SEED] Starting database seeding...');
    try {
        const password = 'Awesome.Pass34';
        const hashedPassword = bcrypt.hashSync(password, 10);
        console.log(`[SEED] Generated hash for ${password}: ${hashedPassword}`);

        // 1. Ensure users exist
        await db.executeStatement("INSERT IGNORE INTO users (ID, username, password) VALUES (1, 'admin1', ?)", [hashedPassword]);
        await db.executeStatement("INSERT IGNORE INTO users (ID, username, password) VALUES (2, 'user1', ?)", [hashedPassword]);
        
        // Always update to ensure the password is what we expect
        await db.executeStatement("UPDATE users SET password = ? WHERE username IN ('admin1', 'user1')", [hashedPassword]);

        // 2. Ensure roles exist
        await db.executeStatement("INSERT IGNORE INTO roles (ID, title) VALUES (1, 'Admin')");
        await db.executeStatement("INSERT IGNORE INTO roles (ID, title) VALUES (2, 'User')");

        // 3. Ensure permissions exist
        await db.executeStatement("INSERT IGNORE INTO permissions (ID, userID, roleID) VALUES (1, 1, 1)");
        await db.executeStatement("INSERT IGNORE INTO permissions (ID, userID, roleID) VALUES (2, 2, 2)");

        console.log('[SEED] Seeding completed successfully!');
    } catch (err) {
        console.error('[SEED] Error during seeding:', err.message);
        // We don't want to crash the whole app if seeding fails (e.g., table not created yet),
        // but we want to know about it.
    }
}

module.exports = seed;
