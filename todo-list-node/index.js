const tasklist = require('./user/tasklist');
const bgSearch = require('./user/backgroundsearch');
const escapeHtml = require('escape-html');

async function getHtml(req) {
    let taskListHtml = await tasklist.html(req);
    return `<h2>Welcome, `+escapeHtml(req.session.username)+`!</h2>` + taskListHtml + '<hr />' + bgSearch.html(req);
}

module.exports = {
    html: getHtml
}