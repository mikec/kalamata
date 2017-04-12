exports.up = (knex, Promise) ->
  Promise.all [
    knex.schema.createTable 'users', (table) ->
      table.increments()
      table.text 'name'
      table.dateTime('created_at').notNullable().defaultTo knex.fn.now()
      table.dateTime('updated_at').notNullable().defaultTo knex.fn.now()
  ,
    knex.schema.createTable 'things', (table) ->
      table.increments()
      table.integer('user_id').references('id').inTable 'users'
      table.text 'type'
      table.boolean 'deleted'
      table.dateTime('created_at').notNullable().defaultTo knex.fn.now()
      table.dateTime('updated_at').notNullable().defaultTo knex.fn.now()
  ]

exports.down = (knex, Promise) ->
  Promise.all [
    knex.schema.dropTableIfExists('users')
    knex.schema.dropTableIfExists('things')
  ]
