## Kalamata

[![Build Status](https://travis-ci.org/mikec/kalamata.svg?branch=master)](https://travis-ci.org/mikec/kalamata)

Fully extensible Node.js REST API framework for [Bookshelf.js](http://bookshelfjs.org/) and [Express](http://expressjs.com/)

Try the sample app [kalamata-sample](https://github.com/mikec/kalamata-sample)

## Install

`npm install kalamata`

## What it is

Kalamata helps you build REST APIs that run on Express.
It provide set of middlewares helping you to creat standard CRUD endpoints.
Combining them with your own middlewares allows you to customise these with your application specific logic.

## How it works

Lets say you have a Bookshelf model called `User`

```js
const User = bookshelf.Model.extend({
    tableName: 'users'
})
```

You can use Kalamata to expose this model to express app:

```js
// import express and kalamata
const express = require('express')
const kalamata = require('kalamata')

const app = express() // create express app
// create middlewares for user model
const user_middlewarez = kalamata(User)

// create standard CRUD endpoints the User model on app
user_middlewarez.init_app(app)

// tell express to listen for incoming requests
app.listen(8080, function() {
    console.log('Server listening on port 8080')
})
```

which will create these endpoints (see [src/index.js](index.js:init_app))

| Method | URL              | Action                        |
| :----- | :------------    | :---------------------------- |
| GET    | `/`              | Get all users                 |
| GET    | `/:id`           | Get a user by id              |
| POST   | `/`              | Create a new user             |
| PUT    | `/:id`           | Update an existing user       |
| DELETE | `/:id`           | Delete an existing user       |
| POST   | `/:id/:relation` | Create a new relation         |
| GET    | `/:id/:relation` | Get a user's relation         |


### Customising the default endpoints

You can customise the default endpoints by swapping default middlewares with your own.

Some examples:

```js
// middleware that sets updated_on attribute before fetched item is saved
function _set_updated_on(req, res, next) {
  // set a propety user is saved
  req.fetched.set('updated_on', Date.now())
  next()  // DON'T forget call next
}
// and use it after fetch and before update
app.put('/:id', user_middlewarez.fetch_middleware, _set_updated_on, user_middlewarez.update_middleware)
```

```js
// middleware that adds another contraint to fetching query
function _omit_deleted(req, res, user) {
  req.query.deleted = false
  next()  // DON'T forget call next
}
app.get('/', user_middlewarez.list_query, _omit_deleted. user_middlewarez.list_middleware)
```

If the server receives a `GET /5` request, but you don't want to respond with the user's data:

```js
function _deny_foruser5(req, res, next) {
  if(req.fetched.get('id') == 5) {
    // break the middleware chain by calling error middleware
    return next({ error: "access denied" })
  }
  next()  // else call next middleware in chain
}
app.get('/:id', user_middlewarez.fetch_middleware, _deny_foruser5, user_middlewarez.detail_middleware)
```


## Default Endpoints

Calling `init_app` on user_middlewares object will create a set of default CRUD endpoints.
Here are the default endpoints, assuming that `user_middlewares.init_app(app)` was called.

#### GET `/`

Gets an array of users

```js
/*
 * GET `/`
 */

// response:
[
    { "id": 1, "name": "user1" },
    { "id": 2, "name": "user2" },
    { "id": 3, "name": "user3" }
]
```
##### `where` parameter includes a where clause in the query

`/?where={name:"user2"}`

Expects the same parameters as the [bookshelf.js where method](http://bookshelfjs.org/#Model-where)

##### `load` parameter will load related models and include them in the response

`/?load=orders,favorites`

Expects a comma delimited string of relations.
Calls the [bookshelf.js load method](http://bookshelfjs.org/#Model-load) method with an array of relations.



#### GET `/:identifier`

Gets a user

```js
/*
 * GET `/2`
 */

// response:
{ "id": 2, "name": "user2" }

```

##### `load` parameter will load related models and include them in the response

`/2?load=orders,favorites`

Expects a comma delimited string of relations.
Calls the [bookshelf.js load method](http://bookshelfjs.org/#Model-load) method with an array of relations.

#### POST `/`

Creates a user

```js
/*
 * POST `/` { "name": "user4" }
 */

// response:
{ "id": 4, "name": "user4" }

```


#### PUT `/:identifier`

Modifies a user

```js
/*
 * PUT `/2` { "name": "user2 MODIFIED" }
 */

// response:
{ "id": 2, "name": "user2 MODIFIED" }

```


#### DELETE `/:identifier`

Deletes a user

```js
/*
 * DELETE `/3`
 */

// response:
true

```


#### GET `/:identifier/things`

Gets an array of things related to a user

```js
/*
 * GET `/2/things`
 */

// response:
[{ "id": 3, "name": "thing3" },{ "id": 4, "name": "thing4" }]

```


#### POST `/:identifier/things`

Relates a thing to a user

```js
/*
 * POST `/2/things` { "id": "3" }
 */

// response:
{}

```
