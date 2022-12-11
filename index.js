const express = require('express');
const bodyParser = require('body-parser');
const query = require('./db/todos');
const auth = require('./services/authentication');
const user_query= require('./db/users');
const app = express();
app.use(bodyParser.json());

const port = 3000;

process.env.SECRET_KEY = "6c2b4034dd2f2f20634ge6d4g31c510610e4ee0e53821b5cb106b3df396c110e1d4841de0c9f2bg4fc95e";

// Routes for REST API
app.get("/api/v1/todos", auth.authenticate, query.getTodos);
app.post("/api/v1/todos", auth.authenticate, query.addTodo);
app.delete("/api/v1/todos/:id", auth.authenticate, query.deleteTodo);
app.put("/api/v1/todos/:id", auth.authenticate, query.updateTodo);
// Route for login
app.post("/api/v1/signin", auth.login);
// Route for signup
app.post("/api/v1/signup",user_query.addUser);
// Route for change password
app.put("/api/v1/changePassword",auth.authenticate, user_query.updatePassword);

app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});

module.exports = app;
