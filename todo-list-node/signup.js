const db = require('./fw/db');
const bcrypt = require('bcryptjs');
const escapeHtml = require('escape-html');

const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireSpecialChar: true,
  requireNumber: true,
};

function validatePasswordStrength(password) {
  const errors = []
  if (password.length < PASSWORD_REQUIREMENTS.minLength)
    errors.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password))
    errors.push('At least one uppercase letter');
  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password))
    errors.push('At least one lowercase letter');
  if (PASSWORD_REQUIREMENTS.requireNumber && !/[0-9]/.test(password))
    errors.push('At least one number');
  if (PASSWORD_REQUIREMENTS.requireSpecial && !/[^A-Za-z0-9]/.test(password))
    errors.push('At least one special character');
  return errors;
}

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
        const passwordErrors = validatePasswordStrength(password)
        if (passwordErrors.length > 0) {
          msg = 'Password is too weak: ' + passwordErrors.join(', ')
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
        <input type="password" class="form-control size-medium" name="password" id="password"
               required oninput="checkPasswordStrength(this.value)">
        <div id="pw-strength-bar" style="height:4px;border-radius:2px;margin-top:6px;width:0%;transition:width .3s,background .3s"></div>
        <ul id="pw-requirements" style="margin:6px 0 0;padding-left:18px;font-size:0.85em;list-style:none"><br><br>
          <li id="req-length"    data-re="">&#x25CB; 8+ characters</li>
          <li id="req-upper"     data-re="">&#x25CB; Uppercase letter</li>
          <li id="req-lower"     data-re="">&#x25CB; Lowercase letter</li>
          <li id="req-number"    data-re="">&#x25CB; Number</li>
          <li id="req-special"   data-re="">&#x25CB; Special character</li>
        </ul>
      </div>
      <div class="form-group">
        <label for="confirm_password">Confirm Password</label>
        <input type="password" class="form-control size-medium" name="confirm_password" id="confirm_password" required>
      </div>
      <div class="form-group">
        <input type="submit" class="btn size-auto" value="Register" />
        <a href="/login" style="margin-left:10px;">Back to Login</a>
      </div>
    </form>
    <script>
      function checkPasswordStrength(pw) {
        const rules = [
          { id: 'req-length',  pass: pw.length >= 8 },
          { id: 'req-upper',   pass: /[A-Z]/.test(pw) },
          { id: 'req-lower',   pass: /[a-z]/.test(pw) },
          { id: 'req-number',  pass: /[0-9]/.test(pw) },
          { id: 'req-special', pass: /[^A-Za-z0-9]/.test(pw) },
        ];
        const passed = rules.filter(r => r.pass).length;
        rules.forEach(r => {
          const el = document.getElementById(r.id);
          el.textContent = (r.pass ? '\\u2713 ' : '\\u25CB ') + el.textContent.slice(2);
          el.style.color = r.pass ? '#2e7d32' : '';
        });
        const bar = document.getElementById('pw-strength-bar');
        const pct = (passed / rules.length) * 100;
        bar.style.width = pct + '%';
        bar.style.background = pct <= 40 ? '#e53935' : pct <= 60 ? '#fb8c00' : pct <= 80 ? '#fdd835' : '#43a047';
      }
    </script>`;
}

module.exports = {
    handleSignup: handleSignup,
    startUserSession: startUserSession
};