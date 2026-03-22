const db = require('./fw/db');
const bcrypt = require('bcryptjs');

async function handleForgotPassword(req, res) {
    let msg = '';
    let success = false;

    if (typeof req.body.username !== 'undefined') {
        const { username } = req.body;
        let result = await verifyUser(username);
        if (result.valid) {
            // In a real app, we'd send an email with a token.
            // Here we'll just redirect to the reset page with the username as a "token" (insecure, but fits the app style)
            res.redirect('/reset-password?user=' + encodeURIComponent(username));
            return null; 
        } else {
            msg = '<div class="alert alert-danger">User not found.</div>';
        }
    }

    return { 'html': msg + getForgotPasswordHtml(), 'success': success };
}

async function handleResetPassword(req, res) {
    let msg = '';
    let success = false;
    const username = req.query.user || req.body.username;

    if (!username) {
        res.redirect('/forgot-password');
        return null;
    }

    if (typeof req.body.password !== 'undefined' && typeof req.body.confirm_password !== 'undefined') {
        const { password, confirm_password } = req.body;
        if (password !== confirm_password) {
            msg = '<div class="alert alert-danger">Passwords do not match.</div>';
        } else {
            let result = await updatePassword(username, password);
            if (result.valid) {
                res.redirect('/login?resetSuccess=true');
                return null;
            } else {
                msg = '<div class="alert alert-danger">' + result.msg + '</div>';
            }
        }
    }

    return { 'html': msg + getResetPasswordHtml(username), 'success': success };
}

async function verifyUser(username) {
    let result = { valid: false };
    let dbConnection;
    try {
        dbConnection = await db.connectDB();
        const sql = "SELECT id FROM users WHERE username = ?";
        const [rows] = await dbConnection.execute(sql, [username]);
        if (rows.length > 0) {
            result.valid = true;
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (dbConnection) await dbConnection.end();
    }
    return result;
}

async function updatePassword(username, password) {
    let result = { valid: false, msg: '' };
    let dbConnection;
    try {
        dbConnection = await db.connectDB();
        const hashedPassword = bcrypt.hashSync(password, 10);
        const sql = "UPDATE users SET password = ? WHERE username = ?";
        await dbConnection.execute(sql, [hashedPassword, username]);
        result.valid = true;
    } catch (err) {
        console.error(err);
        result.msg = "Error updating password.";
    } finally {
        if (dbConnection) await dbConnection.end();
    }
    return result;
}

function getForgotPasswordHtml() {
    return `
    <h2>Forgot Password</h2>
    <p>Please enter your username to reset your password.</p>
    <form method="post" action="/forgot-password">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" class="form-control size-medium" name="username" id="username" required>
        </div>
        <div class="form-group">
            <input type="submit" class="btn size-auto" value="Reset Password" />
            <a href="/login" style="margin-left: 10px;">Back to Login</a>
        </div>
    </form>`;
}

function getResetPasswordHtml(username) {
    return `
    <h2>Set New Password</h2>
    <p>Setting new password for user: <strong>${username}</strong></p>
    <form method="post" action="/reset-password">
        <input type="hidden" name="username" value="${username}">
        <div class="form-group">
            <label for="password">New Password</label>
            <input type="password" class="form-control size-medium" name="password" id="password" required>
        </div>
        <div class="form-group">
            <label for="confirm_password">Confirm New Password</label>
            <input type="password" class="form-control size-medium" name="confirm_password" id="confirm_password" required>
        </div>
        <div class="form-group">
            <input type="submit" class="btn size-auto" value="Update Password" />
        </div>
    </form>`;
}

module.exports = {
    handleForgotPassword,
    handleResetPassword
};
