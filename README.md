Kalamata
========

Fully extensible Node.js REST API framework for [Bookshelf.js](http://bookshelfjs.org/) and [Express](http://expressjs.com/)

[![Build Status](https://travis-ci.org/mikec/kalamata.svg?branch=master)](https://travis-ci.org/mikec/kalamata)

Install
-----------
`cd` into your project and `npm install kalamata`

What it is
-----------

Kalamata helps you build REST APIs that run on Express. It creates some standard CRUD endpoints for you, and allows you to extend these with your application specific logic.

### How it works

Lets say you have a Bookshelf model called `User`

```js
var User = bookshelf.Model.extend({
    tableName: 'users'
});
```

You can use Kalamata to expose this model to your API

```js
// set up express and kalamata
var app = require('express')();
var kalamata = require('kalamata');
var api = kalamata(app);

// expose the User model
api.expose(User);

// tell express to listen for incoming requests
app.listen(8080, function() {
    console.log('Server listening on port 8080');
});
```

which will create these endpoints

| Method | URL          | Action                        |
| :----- | :------------| :---------------------------- |
| GET    | `/users`     | Get all users                 |
| GET    | `/users/:id` | Get a user by id              |
| POST   | `/users`     | Create a new user             |
| PUT    | `/users/:id` | Update an existing user       |
| DELETE | `/users/:id` | Delete an existing user       |


### Extending the default endpoints

You can extend the default endpoints by modifying data before or after it is saved, using `before` and `after` hooks. These give you access to the Express request and response objects, and the Bookshelf model instance.

Some examples:

```js
/*
 * function executes on PUT `/users/:id`
 * before updated user data is saved
 */
api.beforeUpdateUser(function(req, res, user) {
    // set a propety before user is saved
    user.set('updated_on', Date.now());
});

```

```js
/*
 * function executes on GET `/users`
 * before the collection of users is fetched
 */
api.beforeGetUsers(function(req, res, user) {
    // add a where clause to execute when fetching users
    user.where({ deleted:false });
});

```

```js
/*
 * function executes on GET `/users/:id`
 * after a user is fetched
 */
api.afterGetUser(function(req, res, user) {
    if(!isAuthenticatedUser(user)) {
        // override the default user data response
        res.send({ error: 'access denied' });
    }
});

```

Configuring the API
--------------------

##### Initialize `kalamata(expressApp, [options])`

`apiRoot` option sets a prefix for all API endpoints

> ```js
> /*
>  * prefixes all endpoints with `/api/v1`,
>  * for example `/api/v1/users`
>  */
> var api = kalamata(app, { apiRoot: '/api/v1' });
> ```


##### expose `expose(bookshelfModel, [options])`

`endpointName` option sets the name of the endpoint.

> Defaults to the bookshelf model's tableName property.
>
> ```js
> // sets endpoints up on `/allusers`
> api.expose(User, { endpointName: 'allusers' });
> ```

`identifier` option sets the name of the identifier param

> Defaults to `id`
>
> ```js
> /*
>  * when identifier is set to `user_id`,
>  * a request to `/users/32` will fetch
>  * the user with `user_id = 32`
>  */
> api.expose(User, { identifier: 'user_id' });
> ```

`modelName` option sets the name of the model

> Defaults to the endpoint name capitalized with the `s` removed (`users` -> `User`)

`collectionName` options sets the name for a collection of model instances

> Defaults to the endpoint name capitalized (`users` -> `Users`)


Default Endpoints
-------------------

Calling `expose` on a model will create a set of default CRUD endpoints. Here are the default endpoints, assuming that `api.expose(User)` was called.

#### GET `/users`

Gets an array of users

```js
/*
 * GET `/users`
 */

// response:
[
    { "id": 1, "name": "user1" },
    { "id": 2, "name": "user2" },
    { "id": 3, "name": "user3" }
]
```
##### `where` parameter includes a where clause in the query

`/users?where={name:"user2"}`

Expects the same parameters as the [bookshelf.js where method](http://bookshelfjs.org/#Model-where)

##### `load` parameter will load related models and include them in the response

`/users?load=orders,favorites`

Expects a comma delimited string of relations. Calls the [bookshelf.js load method](http://bookshelfjs.org/#Model-load) method with an array of relations.



#### GET `/users/:identifier`

Gets a user

```js
/*
 * GET `/users/2`
 */

// response:
{ "id": 2, "name": "user2" }

```

##### `load` parameter will load related models and include them in the response

`/user/2?load=orders,favorites`

Expects a comma delimited string of relations. Calls the [bookshelf.js load method](http://bookshelfjs.org/#Model-load) method with an array of relations.

#### POST `/users`

Creates a user

```js
/*
 * POST `/users` { "name": "user4" }
 */

// response:
{ "id": 4, "name": "user4" }

```


#### PUT `/users/:identifier`

Modifies a user

```js
/*
 * PUT `/users/2` { "name": "user2 MODIFIED" }
 */

// response:
{ "id": 2, "name": "user2 MODIFIED" }

```


#### DELETE `/users/:identifier`

Deletes a user

```js
/*
 * DELETE `/users/3`
 */

// response:
true

```



Hooks
-------

Hooks let you extend and override default endpoint behaviors.

`before` hooks are executed before the default database action, such as fetch, save, or delete. `after` hooks are executed after all database actions are complete.

Hook names are generated based on endpoint configurations. This list is based on a `/users` endpoint where `modelName = User` and `collectionName = Users`

| Hook Name                 | Request                   | Arguments                     |
| :-------------------------| :------------------------ | :---------------------------- |
| `beforeGetUsers`          | GET `/users`              | [req, res, userModel]         |
| `afterGetUsers`           | GET `/users`              | [req, res, userCollection]    |
| `beforeGetUser`           | GET `/users/:id`          | [req, res, userModel]         |
| `afterGetUser`            | GET `/users/:id`          | [req, res, userModel]         |
| `beforeCreateUser`        | POST `/users`             | [req, res, userModel]         |
| `afterCreateUser`         | POST `/users`             | [req, res, userModel]         |
| `beforeUpdateUser`        | PUT `/users/:id`          | [req, res, userModel]         |
| `afterUpdateUser`         | PUT `/users/:id`          | [req, res, userModel]         |
| `beforeDeleteUser`        | DELETE `/users/:id`       | [req, res, userModel]         |
| `afterDeleteUser`         | DELETE `/users/:id`       | [req, res, userModel]         |
| `beforeGetRelatedThings`  | GET `/users/:id/things`   | [req, res, thingsModel]       |
| `afterGetRelatedThings`   | GET `/users/:id/things`   | [req, res, thingsCollection]  |

`req` and `res` are an Express [request](http://expressjs.com/4x/api.html#request) and [response](http://expressjs.com/4x/api.html#response)

`userModel` is an instance of a [bookshelf model](http://bookshelfjs.org/#Model)

`userCollection` is an instance of a [bookshelf collection](http://bookshelfjs.org/#Collection)

### Adding hooks

```js
api.beforeCreateUser(function(req, res, user) {
    // do stuff before the user is created
});

api.afterCreateUser(function(req, res, user) {
    // do stuff after the user is created
});
```

### What hooks can do

Because you have the full power of Express and Bookshelf within your hooks, you have total control over how the Kalamata endpoints behave. Here are some examples:

#### Manipulating data

If the server receives a `POST /users { "name":"Joey" }` request:

```js
/*
 * The user model can be manipulated before it is saved.
 *
 * When this hook is finished executing,
 * `{ "name":"Joey McGee" }` will be saved
 *
 */
api.beforeCreateUser(function(req, res, user) {
    var userName = user.get('name');
    user.set({name:userName + ' McGee'});
});
```

```js
/*
 * After the user is created, the response can be manipulated.
 *
 * When this hook is finished executing, the server will
 * respond with `{ "name":"Joey", "lastName":"McGee" }`
 *
 * The changes to the user will not be saved, because this hook
 * is executed after the user is saved
 *
 */
api.afterCreateUser(function(req, res, user) {
    var nameSplit = user.get('name').split(' ');
    user.set({
        name: nameSplit[0],
        lastName: nameSplit[1]
    });
});
```

#### Cancelling default actions

If the server receives a `GET /user/5` request, but you don't want to respond with the user's data:

```js
/*
 * Send a response from the before hook
 *
 * Once a response is sent, Kalamata will not execute
 * any of the default actions, including after hooks.
 *
 */
api.beforeGetUser(function(req, res, user) {
    if(user.get('id') == 5) {
        res.send({ error: "access denied" });
    }
});
api.afterGetUser(function(req, res, user) {
    // will not be executed on requests for `user/5`
});

```

#### Overriding default actions

If the server receives a `DELETE /user/5` request, Kalamata will call `user.destroy()` by default. You can override this default behavior by returning a promise from the before hook:

```js
/*
 * Call a function that returns a promise, and have the
 * hook function return the result of that promise
 *
 * Kalamata will not execute the default action,
 * which in this case would have been `user.destroy()`
 *
 * Flag the user as deleted with a `deleted=true` property
 */
api.beforeDeleteUser(function(req, res, user) {
    return user.save({ deleted: true });
});

