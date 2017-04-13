
module.exports = function(model, opts) {

  opts = opts || {}

  function _list_query(req, res, next) {
    if(req.query.where) {
      try {
        req.listquery = parseJSON(req.query.where)
      } catch(err) {
        return next(new Error('Could not parse JSON: ' + req.query.where))
      }
    }
    next()
  }

  function _get_relation_middleware(req, res, next) {
    res.json(req.fetched.related(req.params.relation))
    next()
  }

  function _list_middleware(req, res, next) {
    let mod = new model()
    if(req.listquery) {
      mod = mod.where(req.listquery)
    }
    mod.fetchAll()
    .then(function(collection) {
      res.json(collection)
      next()
    })
    .catch(next)
  }

  function _detail_middleware(req, res, next) {
    res.json(req.fetched) // just send the fetched
    next()
  }

  function _create_middleware(req, res, next) {
    var newitem = new model(req.body)
    newitem.save()
    .then(function(savedModel) {
      req.saveditem = savedModel
      res.status(201).json(savedModel)
      next()
    })
    .catch(next)
  }

  function _create_relation_middleware(req, res, next) {
    const relation = req.fetched.related(req.params.relation)
    // for hasMany relations
    const newitem = new relation.model(req.body)
    relation.create(newitem)
    .then(function(savedModel) {
      req.savedModel = savedModel
      res.status(201).json(savedModel)
      next()
    })
    .catch(next)
  }

  function _fetch_middleware(req, res, next) {
    var mod = new model({id: req.params.id})
    const fetchopts = {
      require: true
    }
    if (req.params.relation) {
      fetchopts.withRelated = [req.params.relation]
    }
    mod.fetch(fetchopts)
    .then(function(fetched) {
      req.fetched = fetched
      next()
    })
    .catch(next)
  }

  function _update_middleware(req, res, next) {
    req.fetched.save(req.body)
    .then(function(saved) {
      res.status(200).json(saved)
    })
    .catch(next)
  }

  function _delete_middleware(req, res, next) {
    req.fetched.destroy()
    .then(function(saved) {
      res.status(200).send('deleted')
      next()
    })
    .catch(next)
  }

  function _init_app(app) {
    app.get('/', _list_query, _list_middleware)
    app.get('/:id', _fetch_middleware, _detail_middleware)
    app.post('/', _create_middleware)
    app.put('/:id', _fetch_middleware, _update_middleware)
    app.delete('/:id', _fetch_middleware, _delete_middleware)
    // relations
    app.get('/:id/:relation', _fetch_middleware, _get_relation_middleware)
    app.post('/:id/:relation', _fetch_middleware, _create_relation_middleware)
  }

  return {
    init_app: _init_app
  }

}
