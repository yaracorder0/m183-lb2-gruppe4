const db = require('./fw/db');
const bcrypt = require('bcryptjs');
const escapeHtml = require('escape-html');

async function handleSignup(req, res) {
  let msg = '';
  let success = false;
  let user = { 'username': '', 'userid': 0, 'roleid': 0 };

  if (typeof req.body.username !== 'undefined' &&
    typeof req.body.password !== 'undefined' &&
    typeof req.body.confirm_password !== 'undefined') {
      const { username, password, confirm_password } = req.body;
      if (password !== confirm_password) {
        msg = 'Passwords dont match'
      } else {
        let result = await registerUser(username, password);
        msg = result.msg;
        success = result.valid;
        if (success) {
            user.username = username;
            user.userid = result.userId;
            user.roleid = result.roleId;
        }
      }
    }

  return { 'html': escapeHtml(msg) + getHtml(), 'success': success, 'user': user };
}

function startUserSession(res, user) {
    console.log('login valid... start user session now for userid '+user.userid);
    res.redirect('/login');
}

async function registerUser(username, password) {
  let result = { valid: false, msg: '', userId: 0, roleId: 2 }; // Default roleId 2 is 'User'
  let dbConnection;

  try {
    dbConnection = await db.connectDB();
    if (!dbConnection) {
      result.msg = "Database connection error!";
      return result;
    }
    const checkSql = "SELECT id FROM users WHERE username = ?";
    const [existing] = await dbConnection.query(checkSql, [username]);

    if (existing.length > 0) {
      result.msg = 'Username already exists'
    } else {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const insertSql = "INSERT INTO users (username, password) VALUES (?, ?)";
      const [insertResult] = await dbConnection.query(insertSql, [username, hashedPassword]);
      
      const userId = insertResult.insertId;
      const permissionSql = "INSERT INTO permissions (userID, roleID) VALUES (?, ?)";
      await dbConnection.query(permissionSql, [userId, result.roleId]);

      result.valid = true;
      result.userId = userId;
      result.msg = "Registration successful";
    }
  } catch (err) {
    console.log(err);
    result.msg = "Error occurred!"
  } finally {
    if (dbConnection) {
      await dbConnection.end();
    }
  }

  return result;
}

function getHtml() {
    return `
    <h2>Sign Up</h2>
    <form id="signup-form" method="post" action="/signup">
        <div class="form-group">
            <label for="username">Username / Email</label>
            <input type="text" class="form-control size-medium" name="username" id="username" required>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" class="form-control size-medium" name="password" id="password" required>
        </div>
        <div class="form-group">
            <label for="confirm_password">Confirm Password</label>
            <input type="password" class="form-control size-medium" name="confirm_password" id="confirm_password" required>
        </div>
        <div class="form-group">
            <input type="submit" class="btn size-auto" value="Register" />
            <a href="/login" style="margin-left: 10px;">Back to Login</a>
        </div>
    </form>`;
}

module.exports = {
    handleSignup: handleSignup,
    startUserSession: startUserSession
};