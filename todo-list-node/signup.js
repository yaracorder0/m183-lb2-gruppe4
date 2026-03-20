const db = require('./fw/db');

async function handleSignup(req, res) {
  let msg = '';
  let success = false;
  //let user = { 'username': '', 'userid': 0 };

  if (typeof req.query.username !== 'undefined' &&
    typeof req.query.password !== 'undefined' &&
    typeof req.query.confirm_password !== 'undefined') {
      const { username, password, confirm_password } = req.query;
      if (password !== confirm_password) {
        msg = 'Passwords dont match'
      } else {
        let result = await registerUser(username, password);
        msg = result.msg;
        success = result.valid;
      }
    }

  return { 'html': msg + getHtml(), 'success': success };
}

function startUserSession(res, user) {
    console.log('login valid... start user session now for userid '+user.userid);
    res.cookie('username', user.username);
    res.cookie('userid', user.userid);
    res.redirect('/');
}

async function registerUser(username, password) {
  let result = { valid: false, msg: '' };
  const dbConnection = await db.connectDB();

  try {
    const checkSql = "SELECT id FROM users WHERE username = ?";
    const [existing] = await db.Connection.query(checkSql, [username]);

    if (existing.length > 0) {
      result.msg = 'Username already exists'
    } else {
      const insertSql = "INSERT INTO users (username, password) VALUES (?, ?)";
      await dbConnection.query(insertSql, [username, password]);

      result.valid = true;
      result.msg = "Registration successful";
    }
  } catch (err) {
    console.log(err);
    result.msg = "Error occurred!"
  }

  return result;
}

function getHtml() {
    return `
    <h2>Sign Up</h2>
    <form id="signup-form" method="get" action="/signup">
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