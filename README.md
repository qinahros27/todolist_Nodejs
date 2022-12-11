# Todolist_Nodejs
## CREATE DATABASE IN POSTGRESQL
### Create database:

``` Create database todo; ```

Next , connecting to the ‘todo’ database by typing:

``` \c todo ```

### Create enum type:

``` CREATE TYPE status_type AS ENUM ('NotStarted','OnGoing','Completed'); ```

### Create the function to automatically sets an updated_at value before any update operation:

``` 
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Create table users:

```
Create table users (
id SERIAL PRIMARY KEY,
email VARCHAR(255) NOT NULL UNIQUE,
password TEXT NOT NULL,
created_at TIMESTAMP NOT NULL DEFAULT NOW(),
updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Create table todos:
```
CREATE TABLE todos (
  id serial PRIMARY KEY,
  name VARCHAR (200) NOT NULL,
  description VARCHAR (200) NOT NULL, 
  userid INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  status status_type,
   CONSTRAINT fk_users FOREIGN KEY(userid) REFERENCES users(id)
);
```

### Create trigger to execute the trigger_set_timestamp function that defined earlier:
For todos table

```
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON todos
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
```
For users table

```
CREATE TRIGGER set_timestamp1
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();
```

## CREATE PROJECT IN VISUAL STUDIO CODE
### Install dependencies and library:
```
Npm install express body-parser
Npm install pg
Npm install jsonwebtoken bcrypt
```

### Create connection to todo database
```
const { Pool } = require('pg')

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  port: 5432,
  database: "todo",
  password: "anhnguyen"
})

module.exports = {
  query: (text, params) => pool.query(text, params),
}
```
In the first line of the index.js file, I import node-postgres Pool module. With the Pool module I can configure and create connection pools to Postgres SQL database.
In the next lines I create a new instance of the Pool module and it gets configuration object as a parameter.
In the final rows,export module that it can be used in other modules. Name it to query that actually then invokes node-postgres pool.query() function that can be used to execute SQL statements to the database.

### Create users.js:
```
const db = require('./dbconfig');
const bcrypt = require('bcrypt');
// Get user by email
const getUserByEmail = (email, next) => {
  const query = {
    text: 'SELECT * FROM users WHERE email = $1',
    values: [email],
  } 


  db.query(query, (err, result) => {
    if (err) {
      return console.error('Error executing query', err.stack)
    }
    else {
      next(result.rows);
    }
  })
}


// Add new user
const addUser = (req, res) => {
  // Extract user from the request body
  const newUser = req.body;
  const hashpassword = bcrypt.hashSync(newUser.password,10);
  
  const query = {
    text: 'INSERT INTO users (email, password) VALUES ($1, $2)',
    values: [newUser.email, hashpassword],
  }
  
  db.query(query, (err, res) => {
    if (err) {
      return console.error('Error executing query', err.stack)
    }
  })
  
  res.json(newUser);
}

// Update Password
const updatePassword = (req, res) => {
  
  const editedPassword = req.body;
  const newpassword = bcrypt.hashSync(editedPassword.password,10);
  const query = {
    text: 'UPDATE users SET password=$1 WHERE email = $2',
    values: [newpassword, editedPassword.email],
  }

  db.query(query, (err, res) => {
    if (err) {
      return console.error('Error executing query', err.stack)
    }
  })

  res.json(editedPassword);
}

module.exports = {
  getUserByEmail: getUserByEmail,
  addUser: addUser,
  updatePassword: updatePassword
}
```

### Create todos.js:

```
const db = require('./dbconfig');

// Get todo
const getTodos = (req, res) => {
  db.query('SELECT * FROM todos', (err, result) => {
  if (err)
    console.error(err);
  else
    res.json(result.rows)
  })
}


// Add new todo
const addTodo = (req, res) => {
  // Extract todo from the request body
  const newTodo = req.body;

  const query = {
    text: 'INSERT INTO todos (name,description,userid,status) VALUES ($1,$2,$3,$4)',
    values: [newTodo.name, newTodo.description, newTodo.userid,newTodo.status],
  }
  
  db.query(query, (err, res) => {
    if (err) {
      return console.error('Error executing query', err.stack)
    }
  })
  
  res.json(newTodo);
}

//Delete todo
const deleteTodo = (req, res) => {
  const query = {
    text: 'DELETE FROM todos WHERE id = $1',
    values: [req.params.id],
  }

  db.query(query, (err, res) => {
    if (err) {
      return console.error('Error executing query', err.stack)
    }
  })

  res.status(204).end();
}


// Update todo
const updateTodo = (req, res) => {
  // Extract edited todo from the request body
  const editedTodo = req.body;

  const query = {
    text: 'UPDATE todos SET name=$1, description=$2, userid=$3 , status=$4 WHERE id = $5',
    values: [editedTodo.name, editedTodo.description, editedTodo.userid, editedTodo.status, req.params.id],
  }

  db.query(query, (err, res) => {
    if (err) {
      return console.error('Error executing query', err.stack)
    }
  })

  res.json(editedTodo);
}

module.exports = {
    getTodos: getTodos,
    addTodo: addTodo,
    deleteTodo: deleteTodo,
    updateTodo: updateTodo
  }
 ```
 
first I import bconfig.js module to .js file to be able to communicate with the database. Next, I define queries. Then export query functions that they can be used in other modules by module.exports.

### Create the authentication services in authentication.js:

```
const jwt = require('jsonwebtoken');
const user = require('../db/users');
const bcrypt = require('bcrypt');

// User login
const login = (req, res) => {
  // Extract email and password from the request body
  const email = req.body.email;
  const password = req.body.password;

  const loginUser = user.getUserByEmail(email, (user) => {
  if (user.length > 0) {
    const hashpwd = user[0].password;
    const token = jwt.sign({userId: email}, process.env.SECRET_KEY);

    if (bcrypt.compareSync(password, hashpwd))
      res.send({token});
    else
      res.sendStatus(400).end(); 
  }
  else {
    res.sendStatus(400).end();
  }
});
}

// User authentication
const authenticate = (req, res, next) => {
  const token = req.header('Authorization');
  if(!token) {
    res.sendStatus(400).end();
  }
  
  // Verify the received token
  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err)
     res.sendStatus(400).end();
   else
     next();
  }); 
}

module.exports = {
  authenticate: authenticate,
  login: login
}
```

In the login function, I first extract email and password from the request body.The query returns an array of users, but the user email is unique in database, therefore I can get user from the first element of the result array. If the user is found from the database , it will generate a token for the user .If password is not correct , it sends response with status 400.
That function is used to verify token in each request. If the token from the request is not correct, the response won't return any data from the database.If there is no token, it sends the response with status 400.

### Create index.js:

``` 
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
```

I assigned secret key for proccess.env.SECRET_KEY . Then create callback function for the queries in a route. With the functions need to be authenticate before execute , I used two callback functions,the first callback function is the authentication and if that is succeeded it continues to the next callback function and return data in the response.

## TEST THE CODE

### POST /api/v1/signup: Sign up as an user of the system, using email & password


![signup](https://user-images.githubusercontent.com/101724167/206883517-f5f87eae-b7bc-495c-983e-74c8d227dad2.png)

Data in postgresql:

![signupindatabase](https://user-images.githubusercontent.com/101724167/206883524-8b0fdafb-c099-4e08-a25a-c6a6fe3fad15.png)

### POST /api/v1/signin: Sign in using email & password. The system will return the JWT token that can be used to call the APIs that follow
Firstly , test the authentication. If I did not sign in , it should response 'Bad Request':
![test the suthentication](https://user-images.githubusercontent.com/101724167/206883569-0be3cbb2-7c5d-421b-9f65-72ddb4c24bc4.png)
 As I want to get the todos data but I did not sign in so I get 'Bad Request'.
 
 Then sign in:
 

![signin1](https://user-images.githubusercontent.com/101724167/206883884-0c6da931-a9b5-457b-8f9a-e9349bd00afc.png)


Then I have the token => I will copy-paste the token to the authentication

![image](https://user-images.githubusercontent.com/101724167/206883667-147c3c59-b02a-4ca8-bd95-e819565955db.png)

Now I can have data returned.

### PUT /api/v1/changePassword: Change user’s password

![changepw1](https://user-images.githubusercontent.com/101724167/206883697-c9be299b-256e-4c3d-8f59-090d65c72298.png)

The password in database also changed:

 ![changpwdatabase](https://user-images.githubusercontent.com/101724167/206883707-a09a521e-be04-4317-9bda-660adcc5a0a9.png)

Then I test the new password , if it works right , then I will have the token:
![test new pw](https://user-images.githubusercontent.com/101724167/206883731-58635aea-1a7f-4b32-b408-b1bc3c807090.png)

### GET /api/v1/todos?status=[status]: Get a list of todo items. Optionally, a status query param can be included to return only items of specific status. If not present, return all items
![get status](https://user-images.githubusercontent.com/101724167/206883743-87dad54b-6b52-4016-b48f-257011c59db9.png)

### POST /api/v1/todos: Create a new todo item
![posttodo](https://user-images.githubusercontent.com/101724167/206883745-a27306f2-5b27-469d-9da4-642d073a6e47.png)

New todo in postgre:
![posttododatabase](https://user-images.githubusercontent.com/101724167/206883755-39b44b29-48d3-4184-89be-fcde0d846f91.png)

### PUT /api/v1/todos/:id: Update a todo item
![updatetodo](https://user-images.githubusercontent.com/101724167/206883760-a87e666d-ea05-4714-aa70-487b80ea2102.png)

todo changed in database:

![updatetododatabase](https://user-images.githubusercontent.com/101724167/206883930-166f1c94-8664-4581-9d3a-60552ec8465d.png)

### DELETE /api/v1/todos/:id: Delete a todo item

![deletetodo](https://user-images.githubusercontent.com/101724167/206883771-7c8460d6-3b1c-4a77-b2b0-34e0b0b4806a.png)

This item also deleted in postgresql:

![deletetododatabase](https://user-images.githubusercontent.com/101724167/206883777-8ba03045-7c64-4089-8c38-60a9c3591a61.png)
