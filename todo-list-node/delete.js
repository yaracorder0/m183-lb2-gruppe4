const db = require('./fw/db');
const logger = require('./fw/logger');

async function getHtml(req) {
    let taskId = req.body.id;
    let userid = req.session.userid;

    if (taskId) {
        // Execute delete only if task belongs to the user
        let result = await db.executeStatement("DELETE FROM tasks WHERE ID = ? AND userID = ?", [taskId, userid]);
        
        if (result.affectedRows > 0) {
            logger.info({
                event: 'task_deleted',
                username: req.session.username,
                userid: userid,
                task_id: taskId,
                timestamp: new Date().toISOString()
            });
            return "<span class='info info-success'>Task deleted successfully</span><br><a href='/'>Back to Tasks</a>";
        } else {
            logger.warn({
                event: 'task_delete_denied',
                username: req.session.username,
                userid: userid,
                task_id: taskId,
                timestamp: new Date().toISOString()
            });
            return "<span class='info info-error'>Task not found or access denied</span><br><a href='/'>Back to Tasks</a>";
        }
    } else {
        return "<span class='info info-error'>No task ID provided</span><br><a href='/'>Back to Tasks</a>";
    }
}

module.exports = { html: getHtml };
