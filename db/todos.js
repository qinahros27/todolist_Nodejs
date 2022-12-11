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
  