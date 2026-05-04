require('dotenv').config();

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const header = require('./fw/header');
const footer = require('./fw/footer');
const login = require('./login');
const signup = require('./signup')
const passwordReset = require('./passwordreset');
const index = require('./index');
const adminUser = require('./admin/users');
const editTask = require('./edit');
const deleteTask = require('./delete');
const saveTask = require('./savetask');
const search = require('./search');
const searchProvider = require('./search/v2/index');
const seed = require('./seed');
const escapeHtml = require('escape-html');

const app = express();
const PORT = 3000;

// Seed the database on startup
seed();

// Middleware für Session-Handling
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-12345',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false, // set to true if using HTTPS
        sameSite: 'lax'
    }
}));

// Middleware für Body-Parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Basic Security Headers
app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/; frame-src https://www.google.com/recaptcha/; style-src 'self' 'unsafe-inline';");
    next();
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Routen
app.get('/', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await index.html(req), req)
        res.send(html);
    } else {
        res.redirect('login');
    }
});

app.post('/', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await index.html(req), req)
        res.send(html);
    } else {
        res.redirect('login');
    }
})

// edit task
app.get('/admin/users', async (req, res) => {
    if(activeUserSession(req) && req.session.roleid === 1) {
        let html = await wrapContent(await adminUser.html(), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// edit task
app.get('/edit', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await editTask.html(req), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// delete task
app.post('/delete', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await deleteTask.html(req), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// Login-Seite anzeigen
app.get('/login', async (req, res) => {
    let content = await login.handleLogin(req, res);

    if(content.user.userid !== 0) {
        // login was successful... set session and redirect to /
        login.startUserSession(req, res, content.user);
    } else {
        // login unsuccessful or not made jet... display login form
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
});

app.post('/login', async (req, res) => {
    let content = await login.handleLogin(req, res);

    if(content.user.userid !== 0) {
        // login was successful... set session and redirect to /
        login.startUserSession(req, res, content.user);
    } else {
        // login unsuccessful or not made jet... display login form
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
});

app.get('/signup', async (req, res) => {
    let content = await signup.handleSignup(req, res);
    let html = await wrapContent(content.html, req);
    res.send(html);
})

app.post('/signup', async (req, res) => {
    let content = await signup.handleSignup(req, res);

    if (content.user.userid !== 0) {
        // Redirect to login page with a success message indicator
        res.redirect('/login?signupSuccess=true');
    } else {
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
})

app.get('/forgot-password', async (req, res) => {
    let content = await passwordReset.handleForgotPassword(req, res);
    if (content) {
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
})

app.post('/forgot-password', async (req, res) => {
    let content = await passwordReset.handleForgotPassword(req, res);
    if (content) {
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
})

app.get('/reset-password', async (req, res) => {
    let content = await passwordReset.handleResetPassword(req, res);
    if (content) {
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
})

app.post('/reset-password', async (req, res) => {
    let content = await passwordReset.handleResetPassword(req, res);
    if (content) {
        let html = await wrapContent(content.html, req);
        res.send(html);
    }
})

// Logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Profilseite anzeigen
app.get('/profile', (req, res) => {
    if (req.session.loggedin) {
        res.send(`Welcome, ${escapeHtml(req.session.username)}! <a href="/logout">Logout</a>`);
    } else {
        res.send('Please login to view this page');
    }
});

// save task
app.post('/savetask', async (req, res) => {
    if (activeUserSession(req)) {
        let html = await wrapContent(await saveTask.html(req), req);
        res.send(html);
    } else {
        res.redirect('/');
    }
});

// search
app.post('/search', async (req, res) => {
    let html = await search.html(req);
    res.send(html);
});

// search provider
app.get('/search/v2/', async (req, res) => {
    if (activeUserSession(req)) {
        let result = await searchProvider.search(req);
        res.send(result);
    } else {
        res.status(403).send('Unauthorized');
    }
});


// Server starten
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

async function wrapContent(content, req) {
    let headerHtml = await header(req);
    return headerHtml+content+footer;
}

function activeUserSession(req) {
    // check if session with user information is set
    console.log('in activeUserSession');
    return req.session !== undefined && req.session.loggedin === true;
}