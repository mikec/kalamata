Knex = require('knex')

debugopts =
  client: 'sqlite3'
  connection:
    filename: ':memory:'
  debug: true
  migrations:
    directory: __dirname + '/migrations'

knex = Knex(debugopts)
bookshelf = require('bookshelf')(knex)

User = bookshelf.Model.extend
  tableName: 'users'

Tool = bookshelf.Model.extend
  tableName: 'tools'

knex.models =
  User: User
  Tool: Tool

module.exports = knex
