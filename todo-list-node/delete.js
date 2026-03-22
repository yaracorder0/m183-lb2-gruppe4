const db = require('./fw/db');

async function getHtml(req) {
    let taskId = req.query.id;
    let userid = req.session.userid;

    if (taskId) {
        // Execute delete only if task belongs to the user
        await db.executeStatement("DELETE FROM tasks WHERE ID = ? AND userID = ?", [taskId, userid]);
        return "<span class='info info-success'>Task deleted successfully</span><br><a href='/'>Back to Tasks</a>";
    } else {
        return "<span class='info info-error'>No task ID provided</span><br><a href='/'>Back to Tasks</a>";
    }
}

module.exports = { html: getHtml };
