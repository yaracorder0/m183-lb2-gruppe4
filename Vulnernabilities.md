| File                              | Vulnerability                      | Description                                                                                        |
|-----------------------------------|------------------------------------|----------------------------------------------------------------------------------------------------|
| todo-list-node\login.js           | SQL Injection                      | User input (username) is concatenated directly into SQL queries.                                   |
| todo-list-node\login.js           | Weak Authentication                | Passwords are compared in plaintext; no hashing or salting.                                        |
| todo-list-node\login.js           | Sensitive Data Exposure            | User session data (username, userid) is stored in unencrypted, non-secure cookies.                 |
| todo-list-node\app.js             | Broken Authentication              | activeUserSession only checks for the existence of a username cookie, which can be easily spoofed. |
| todo-list-node\app.js             | Broken Access Control              | The /admin/users route does not verify if the user has admin privileges.                           |
| todo-list-node\app.js             | Insecure Configuration             | Session secret is hardcoded as 'secret'.                                                           |
| todo-list-node\savetask.js        | SQL Injection                      | taskId, title, and state are used directly in SELECT, INSERT, and UPDATE statements.               |
| todo-list-node\savetask.js        | Insecure Direct Object Reference   | userid is taken from a cookie, allowing a user to save tasks for any user by changing the cookie.  |
| todo-list-node\search.js          | Server-Side Request Forgery (SSRF) | The provider parameter from the request body is used to build a URL for an internal axios request. |
| todo-list-node\search\v2\index.js | SQL Injection                      | userid and terms are concatenated into the SQL query.                                              |
| todo-list-node\search\v2\index.js | Cross-Site Scripting (XSS)         | Task titles from the database are rendered directly into HTML without escaping.                    |
| todo-list-node\admin\users.js     | Sensitive Data Exposure            | Plaintext passwords for all users are sent to the client in hidden input fields.                   |
| todo-list-node\user\tasklist.js   | SQL Injection                      | userid from cookie is used directly in a query.                                                    |
| todo-list-node\user\tasklist.js   | Cross-Site Scripting (XSS)         | Task titles are rendered directly into HTML.                                                       |
| todo-list-node\edit.js            | SQL Injection                      | taskId from query string is used directly in a query.                                              |
| todo-list-node\edit.js            | Cross-Site Scripting (XSS)         | title and taskId are rendered into the form without escaping.                                      |
| todo-list-node\index.js           | Cross-Site Scripting (XSS)         | username from cookie is rendered directly into the welcome message.                                |
| todo-list-node\fw\header.js       | SQL Injection                      | userid from cookie is used directly in a query.                                                    |
| todo-list-node\config.js          | Information Exposure               | Database credentials (root password) are stored in plaintext in the source code.                   |
| docker\db\m183_lb2.sql            | Insecure Storage                   | Default users have plaintext passwords stored in the database.                                     |


# Vulnerabilities by File and Line Number

todo-list-node\login.js
• Line 37: SQL Injection — The username is concatenated directly into the SQL query: SELECT id, username, password FROM users WHERE username=' + username + '.
• Line 48: Weak Authentication — Plaintext password comparison: if (password == db_password).
• Lines 26-27: Sensitive Data Exposure — User identity is stored in unencrypted, non-secure cookies: res.cookie('username', user.username); res.cookie('userid', user.userid);.