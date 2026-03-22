const db = require('./fw/db');
const bcrypt = require('bcryptjs');

async function handleLogin(req, res) {
    let msg = '';
    let user = { 'username': '', 'userid': 0, 'roleid': 0 };

    if (req.query.signupSuccess === 'true') {
        msg = '<div class="alert alert-success" style="background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin-bottom: 20px;">Account creation successful! Please log in.</div>';
    }

    if (req.query.resetSuccess === 'true') {
        msg = '<div class="alert alert-success" style="background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin-bottom: 20px;">Password reset successful! Please log in with your new password.</div>';
    }

    if(typeof req.body.username !== 'undefined' && typeof req.body.password !== 'undefined') {
        // Get username and password from the form and call the validateLogin
        let result = await validateLogin(req.body.username, req.body.password);

        if(result.valid) {
            // Login is correct. Store user information to be returned.
            user.username = req.body.username;
            user.userid = result.userId;
            user.roleid = result.roleId;
            msg = result.msg;
        } else {
            msg = result.msg;
        }
    }

    return { 'html': msg + getHtml(), 'user': user };
}

function startUserSession(req, res, user) {
    console.log('login valid... start user session now for userid '+user.userid);
    req.session.loggedin = true;
    req.session.username = user.username;
    req.session.userid = user.userid;
    req.session.roleid = user.roleid;
    res.redirect('/');
}

async function validateLogin (username, password) {
    let result = { valid: false, msg: '', userId: 0, roleId: 0 };

    // Connect to the database
    const dbConnection = await db.connectDB();

    const sql = `SELECT users.id userid, roles.id roleid, users.password FROM users 
                 INNER JOIN permissions ON users.id = permissions.userid 
                 INNER JOIN roles ON permissions.roleID = roles.id 
                 WHERE username = ?`;
    try {
        const [results, fields] = await dbConnection.execute(sql, [username]);
        console.log('[DEBUG_LOG] results for user ' + username + ':', results);

        if(results.length > 0) {
            // Bind the result variables
            let db_id = results[0].userid;
            let db_roleId = results[0].roleid;
            let db_password = results[0].password;

            console.log('[DEBUG_LOG] comparing passwords...');
            // Verify the password with bcrypt
            if (bcrypt.compareSync(password, db_password)) {
                console.log('[DEBUG_LOG] password match');
                result.userId = db_id;
                result.roleId = db_roleId;
                result.valid = true;
                result.msg = 'login correct';
            } else {
                console.log('[DEBUG_LOG] password mismatch');
                // Password is incorrect
                result.msg = 'Incorrect password';
            }
        } else {
            console.log('[DEBUG_LOG] user not found');
            // Username does not exist
            result.msg = 'Username does not exist';
        }

        console.log(results); // results contains rows returned by server
        //console.log(fields); // fields contains extra meta data about results, if available
    } catch (err) {
        console.log('[DEBUG_LOG] error in validateLogin:', err);
        console.log(err);
    } finally {
        await dbConnection.end();
    }
    
    return result;
}

function getHtml() {
    return `
    <h2>Login</h2>

    <form id="form" method="post" action="/login">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" class="form-control size-medium" name="username" id="username">
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" class="form-control size-medium" name="password" id="password">
        </div>
        <div class="form-group">
            <label for="submit" ></label>
            <input id="submit" type="submit" class="btn size-auto" value="Login" />
            <!-- Added Sign Up Button -->
            <a href="/signup" class="btn size-auto" style="text-decoration: none; background-color: #00a0e5; color: white; padding: 5px 10px; border: 1px solid #00a0e5; margin-left: 10px; border-radius: 3px; font-size: 16px;">Sign Up</a>
            <a href="/forgot-password" style="margin-left: 10px; font-size: 0.9em;">Forgot Password?</a>
        </div>
    </form>`;
}   

module.exports = {
    handleLogin: handleLogin,
    startUserSession: startUserSession
};