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


// Add new todo
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
