const db = require('./fw/db');
const escapeHtml = require('escape-html');

async function getHtml(req) {
    let title = '';
    let state = '';
    let taskId = '';
    let html = '';
    let options = ["Open", "In Progress", "Done"];

    if(req.query.id !== undefined) {
        taskId = req.query.id;
        let result = await db.executeStatement('SELECT ID, title, state FROM tasks WHERE ID = ? AND userID = ?', [taskId, req.session.userid]);
        if(result.length > 0) {
            title = result[0].title;
            state = result[0].state;
        }

        html += `<h1>Edit Task</h1>`;
    } else {
        html += `<h1>Create Task</h1>`;
    }

    html += `
    <form id="form" method="post" action="savetask">
        <input type="hidden" name="id" value="`+escapeHtml(String(taskId))+`" />
        <div class="form-group">
            <label for="title">Description</label>
            <input type="text" class="form-control size-medium" name="title" id="title" value="`+escapeHtml(title)+`">
        </div>
        <div class="form-group">
            <label for="state">State</label>
            <select name="state" id="state" class="size-auto">`;

    for(let i = 0; i < options.length; i++) {
        let selected = state === options[i].toLowerCase() ? 'selected' : '';
        html += `<option value='`+escapeHtml(options[i].toLowerCase())+`' `+selected+`>`+escapeHtml(options[i])+`</option>`;
    }

    html += `
            </select>
        </div>
        <div class="form-group">
            <label for="submit" ></label>
            <input id="submit" type="submit" class="btn size-auto" value="Submit" />
        </div>
    </form>
    <script>
        $(document).ready(function () {
        $('#form').validate({
            rules: {
                title: {
                    required: true
                }
            },
            messages: {
                title: 'Please enter a description.',
            },
            submitHandler: function (form) {
                form.submit();
            }
        });
    });
    </script>`;

    return html;
}

module.exports = { html: getHtml }