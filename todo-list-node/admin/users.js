const db = require('../fw/db');
const escapeHtml = require('escape-html');
const logger = require('../fw/logger');

async function getHtml(req) {
    if (req && req.session) {
        logger.info({
            event: 'admin_view_users',
            admin_username: req.session.username,
            admin_id: req.session.userid,
            timestamp: new Date().toISOString()
        });
    }
    let html = '';
    let result = await db.executeStatement("SELECT users.ID, users.username, roles.title FROM users inner join permissions on users.ID = permissions.userID inner join roles on permissions.roleID = roles.ID order by username");

    html += `
    <h2>User List</h2>

    <table>
        <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Role</th>
        </tr>`;

    result.map(function (record) {
        html += `<tr><td>`+escapeHtml(String(record.ID))+`</td><td>`+escapeHtml(record.username)+`</td><td>`+escapeHtml(record.title)+`</td></tr>`;
    });

    html += `
    </table>`;

    return html;
}

module.exports = { html: getHtml };