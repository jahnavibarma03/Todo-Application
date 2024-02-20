const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const format = require('date-fns/format')

const app = express()
app.use(express.json())
const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null
const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
  }
}
intializeDBAndServer()


//GET API
const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let status1 = request.query
  console.log(status1.status)
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query;
  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodosQuery = `select * from todo WHERE todo LIKE '%${search_q}%'
      AND status = '${status}' AND priority='${priority}';`
      break
    case hasPriority(request.query):
      getTodosQuery = `select * from todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}';`
      break
    case hasStatus(request.query):
      getTodosQuery = `select * from todo WHERE todo LIKE '%${search_q}%' AND status='${status}';`
      break
    default:
      getTodosQuery = `select * from todo where todo LIKE '%${search_q}%';`
  }
  data = await db.all(getTodosQuery)
  response.send(data)
})

//GET TODO with ID
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `select * from todo where id = ${todoId};`
  const todo1 = await db.get(getTodoQuery)
  response.send(todo1)
})

//AGENDA DATE

app.get('/agenda/', async (request, response) => {
  const {date} = request.query
  const getQuery = `SELECT * from todo where due_date='${date}'`
  data = await db.all(getQuery)
  response.send(data)
})
//POSTing todo
app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails
  const addTodoQuery = `Insert into todo(id,todo,priority,status)
  values(${id},'${todo}','${priority}','${status}');`
  await db.run(addTodoQuery)
  response.send('Todo Successfully Added')
})

//UPDATE
app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  let UpdatedColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      UpdatedColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      UpdatedColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      UpdatedColumn = 'Todo'
      break
    case requestBody.category !== undefined:
      UpdatedColumn = 'Category'
      break
    case requestBody.dueDate !== undefined:
      UpdatedColumn = 'Due Date'
  }
  const previousTodoQuery = `select * from todo where id=${todoId};`
  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body

  const updateTodoQuery = `update todo set todo = '${todo}',priority = '${priority}',status='${status}',category='${category}',due_date='${dueDate}' where id = ${todoId};`
  await db.run(updateTodoQuery)
  response.send(`${UpdatedColumn} Updated`)
})

//DELETEing the TODO
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `delete from todo where id=${todoId};`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
