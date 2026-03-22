const db = require('./fw/db');
const axios = require('axios');
const bcrypt = require('bcryptjs');


const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY;
const MAX_FAILED_ATTEMPTS = 3;

async function handleLoginPage(req) {
    const failedAttempts = req.session.failedLoginAttempts || 0;
    const showCaptcha = failedAttempts >= MAX_FAILED_ATTEMPTS;

    return {
        html: getHtml('', showCaptcha)
    };
}

async function handleLogin(req, res) {
    let msg = '';
    let user = { 'username': '', 'userid': 0, 'roleid': 0 };

    if (req.query.signupSuccess === 'true') {
        msg = '<div class="alert alert-success" style="background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin-bottom: 20px;">Account creation successful! Please log in.</div>';
    }

    if (req.query.resetSuccess === 'true') {
        msg = '<div class="alert alert-success" style="background-color: #d4edda; color: #155724; padding: 10px; border-radius: 5px; margin-bottom: 20px;">Password reset successful! Please log in with your new password.</div>';
    }

    const username = req.body.username;
    const password = req.body.password;

    const failedAttempts = req.session.failedLoginAttempts || 0;
    const showCaptcha = failedAttempts >= MAX_FAILED_ATTEMPTS;

if (typeof username !== 'undefined' && typeof password !== 'undefined') {
        // Get username and password from the form and call the validateLogin
        if (showCaptcha) {
            const captchaToken = req.body['g-recaptcha-response'];

            if (!captchaToken) {
                return {
                    html: getHtml('Please complete the reCAPTCHA.', true),
                    user
                };
            }

            const captchaValid = await verifyRecaptcha(captchaToken, req.ip);

            if (!captchaValid) {
                return {
                    html: getHtml('reCAPTCHA verification failed. Please try again.', true),
                    user
                };
            }
        }

        let result = await validateLogin(req.body.username, req.body.password);

        if(result.valid) {
            // Login is correct. Store user information to be returned.
            user.username = username;
            user.userid = result.userId;
            user.roleid = result.roleId;
            msg = result.msg;

            req.session.failedLoginAttempts = 0;
        } else {
            req.session.failedLoginAttempts = failedAttempts + 1;
            const nowShowCaptcha = req.session.failedLoginAttempts >= MAX_FAILED_ATTEMPTS;
            msg = result.msg;
            return {
                html: getHtml(msg, nowShowCaptcha),
                user
            };
        }
    }
    const updatedFailedAttempts = req.session.failedLoginAttempts || 0;
    const updatedShowCaptcha = updatedFailedAttempts >= MAX_FAILED_ATTEMPTS;

    return { html: getHtml(msg, updatedShowCaptcha), user };
}

function startUserSession(req, res, user) {
    console.log('login valid... start user session now for userid '+user.userid);
    req.session.loggedin = true;
    req.session.username = user.username;
    req.session.userid = user.userid;
    req.session.roleid = user.roleid;
    req.session.failedLoginAttempts = 0;

    res.redirect('/');
}

async function verifyRecaptcha(token, remoteIp) {
    try {
        const params = new URLSearchParams();
        params.append('secret', RECAPTCHA_SECRET_KEY);
        params.append('response', token);
        if (remoteIp) {
            params.append('remoteip', remoteIp);
        }

        const response = await axios.post(
            'https://www.google.com/recaptcha/api/siteverify',
            params,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        return response.data.success === true;
    } catch (err) {
        console.log('reCAPTCHA verification error:', err.message);
        return false;
    }
}

async function validateLogin(username, password) {
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
        result.msg = 'Login error';
    } finally {
        await dbConnection.end();
    }

    return result;
}

function getHtml(msg = '', showCaptcha = false) {
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
        ${showCaptcha ? `
            <div class="form-group">
                <div class="g-recaptcha" data-sitekey="${RECAPTCHA_SITE_KEY}"></div>
            </div>
            <script src="https://www.google.com/recaptcha/api.js" async defer></script>
        ` : ''}

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
    startUserSession: startUserSession,
    handleLoginPage: handleLoginPage
};