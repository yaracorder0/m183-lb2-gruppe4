const db = require('./fw/db');
const axios = require('axios');

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
    let user = { 'username': '', 'userid': 0 };

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

        let result = await validateLogin(username, password);

        if(result.valid) {
            // Login is correct. Store user information to be returned.
            user.username = username;
            user.userid = result.userId;
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
    req.session.failedLoginAttempts = 0;

    res.cookie('username', user.username);
    res.cookie('userid', user.userid);
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
    let result = { valid: false, msg: '', userId: 0 };

    const dbConnection = await db.connectDB();

    const sql = 'SELECT id, username, password FROM users WHERE username = ?';

    try {
        const [results] = await dbConnection.execute(sql, [username]);

        if (results.length > 0) {
            let db_id = results[0].id;
            let db_password = results[0].password;

            if (password == db_password) {
                result.userId = db_id;
                result.valid = true;
                result.msg = 'login correct';
            } else {
                result.msg = 'Incorrect password';
            }
        } else {
            result.msg = 'Username does not exist';
        }

        console.log(results);
    } catch (err) {
        console.log(err);
        result.msg = 'Login error';
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
            <a href="/signup" class="btn size-auto" style="text-decoration: none; background-color: #eee; color: black; padding: 5px 10px; border: 1px solid #ccc; margin-left: 10px;">Sign Up</a>
        </div>
    </form>`;
}

module.exports = {
    handleLogin: handleLogin,
    startUserSession: startUserSession,
    handleLoginPage: handleLoginPage
};