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
bookshelf.plugin('pagination')

Thing = bookshelf.Model.extend
  tableName: 'things'
  user: () ->
    return this.belongsTo(User)

User = bookshelf.Model.extend
  tableName: 'users'
  tools: () ->
    return this.hasMany(Thing, 'user_id')

knex.models =
  User: User
  Thing: Thing

module.exports = knex
