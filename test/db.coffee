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

Thing = bookshelf.Model.extend
  tableName: 'things'

User = bookshelf.Model.extend
  tableName: 'users'
  tools: () ->
    return this.hasMany(Thing)

knex.models =
  User: User
  Thing: Thing

module.exports = knex
