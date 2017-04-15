
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

  function _load_query(req, res, next) {
    if(req.query.load) {
      try {
        req.loadquery = req.query.load.split(',')
      } catch(err) {
        return next(new Error('could not parse query.load: ' + req.query.load))
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
    const fetchopts = {}
    if (req.loadquery) {
      fetchopts.withRelated = req.loadquery
    }
    mod.fetchAll(fetchopts)
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

  function _delete_relation_middleware(req, res, next) {
    req.foundrelated.invokeThen('destroy')
    .then((deleted) => {
      res.status(200).send('deleted')
      next()
    })
    .catch(next)
  }

  function _update_relation_middleware(req, res, next) {
    req.foundrelated.map((i) => {
      i.set(req.body)   // updated values
    })
    req.foundrelated.invokeThen('save')
    .then((saved) => {
      res.status(200).send('saved')
      next()
    })
    .catch(next)
  }

  function _load_related_middleware(req, res, next) {
    const relation = req.fetched.related(req.params.relation)
    relation.query({where: req.query}).fetch()
    .then((found) => {
      req.foundrelated = found
      next()
    })
    .catch(next)
  }

  function _fetch_middleware(req, res, next) {
    var mod = new model({id: req.params.id})
    const fetchopts = {
      require: true,
      withRelated: []
    }
    if (req.params.relation) {
      fetchopts.withRelated.push(req.params.relation)
    }
    if (req.loadquery) {
      fetchopts.withRelated = fetchopts.withRelated.concat(req.loadquery)
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
    app.get('/', _list_query, _load_query, _list_middleware)
    app.get('/:id', _load_query, _fetch_middleware, _detail_middleware)
    app.post('/', _create_middleware)
    app.put('/:id', _fetch_middleware, _update_middleware)
    app.delete('/:id', _fetch_middleware, _delete_middleware)
    // relations
    app.get('/:id/:relation', _fetch_middleware, _get_relation_middleware)
    app.post('/:id/:relation', _fetch_middleware, _create_relation_middleware)
    app.put('/:id/:relation', _fetch_middleware, _load_related_middleware, _update_relation_middleware)
    app.delete('/:id/:relation', _fetch_middleware, _load_related_middleware, _delete_relation_middleware)
  }

  return {
    init_app: _init_app,
    list_query: _list_query,
    load_query: _load_query,
    get_relation_middleware: _get_relation_middleware,
    list_middleware: _list_middleware,
    detail_middleware: _detail_middleware,
    create_middleware: _create_middleware,
    create_relation_middleware: _create_relation_middleware,
    delete_relation_middleware: _delete_relation_middleware,
    load_related_middleware: _load_related_middleware,
    fetch_middleware: _fetch_middleware,
    update_middleware: _update_middleware,
    delete_middleware: _delete_middleware
  }

}
