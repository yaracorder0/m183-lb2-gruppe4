const db = require('./fw/db');

async function getHtml(req) {
    let html = '';
    let taskId = '';

    // If an ID is provided, verify it belongs to the user before updating
    if (req.body.id !== undefined && req.body.id.trim() !== '') {
        taskId = req.body.id;
    }

    if (req.body.title !== undefined && req.body.state !== undefined){
        let state = req.body.state;
        let title = req.body.title;
        let userid = req.session.userid;

        if (taskId === ''){
            await db.executeStatement("INSERT INTO tasks (title, state, userID) VALUES (?, ?, ?)", [title, state, userid]);
        } else {
            // To properly fix TOCTOU and ownership in one go:
            // We use a single UPDATE that checks userID, which is already atomic in MySQL for a single row.
            // Using UPDATE with both ID and userID in the WHERE clause ensures that the update
            // only happens if the task exists and belongs to the authenticated user.
            let result = await db.executeStatement("UPDATE tasks SET title = ?, state = ? WHERE ID = ? AND userID = ?", [title, state, taskId, userid]);
            if (result.affectedRows === 0) {
                html += "<span class='info info-error'>Update failed: Task not found or access denied</span>";
                return html;
            }
        }

        html += "<span class='info info-success'>Update successful</span>";
    } else {
        html += "<span class='info info-error'>No update was made</span>";
    }

    return html;
}

module.exports = { html: getHtml }