const db = require('./fw/db');

async function getHtml(req) {
    let html = '';
    let taskId = '';

    // see if the id exists in the database and belongs to the user
    if (req.body.id !== undefined && req.body.id.length !== 0) {
        taskId = req.body.id;
        let stmt = await db.executeStatement('SELECT ID FROM tasks WHERE ID = ? AND userID = ?', [taskId, req.session.userid]);
        if (stmt.length === 0) {
            taskId = '';
            // If the task existed but didn't belong to the user, we should probably throw an error, 
            // but for now, we just treat it as a new task creation or ignore it to prevent IDOR.
        }
    }

    if (req.body.title !== undefined && req.body.state !== undefined){
        let state = req.body.state;
        let title = req.body.title;
        let userid = req.session.userid;

        if (taskId === ''){
            await db.executeStatement("INSERT INTO tasks (title, state, userID) VALUES (?, ?, ?)", [title, state, userid]);
        } else {
            await db.executeStatement("UPDATE tasks SET title = ?, state = ? WHERE ID = ? AND userID = ?", [title, state, taskId, userid]);
        }

        html += "<span class='info info-success'>Update successful</span>";
    } else {
        html += "<span class='info info-error'>No update was made</span>";
    }

    return html;
}

module.exports = { html: getHtml }