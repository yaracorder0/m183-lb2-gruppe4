const db = require('../fw/db');
const escapeHtml = require('escape-html');

async function getHtml(req) {
    let html = `
    <section id="list">
        <a href="edit">Create Task</a>
        <table>
            <tr>
                <th>ID</th>
                <th>Description</th>
                <th>State</th>
                <th></th>
            </tr>
    `;

    let result = await db.executeStatement('select ID, title, state from tasks where UserID = ?', [req.session.userid]);
    console.log(result);
    result.forEach(function(row) {
        html += `
            <tr>
                <td>`+escapeHtml(String(row.ID))+`</td>
                <td class="wide">`+escapeHtml(row.title)+`</td>
                <td>`+escapeHtml(ucfirst(row.state))+`</td>
                <td>
                    <a href="edit?id=`+escapeHtml(String(row.ID))+`">edit</a> | <a href="delete?id=`+escapeHtml(String(row.ID))+`">delete</a>
                </td>
            </tr>`;
    });

    html += `
        </table>
    </section>`;

    return html;
}

function ucfirst(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
    html: getHtml
}