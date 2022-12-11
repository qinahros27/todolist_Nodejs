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
