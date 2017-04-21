
module.exports = function(model, opts) {

  opts = opts || {}

  function _list_query(req, res, next) {
    try {
      req.listquery = req.query.where ? parseJSON(req.query.where) : {}
    } catch(err) {
      return next(new Error('Could not parse JSON: ' + req.query.where))
    }
    next()
  }

  function _load_query(req, res, next) {
    try {
      req.loadquery = req.query.load ? req.query.load.split(',') : []
    } catch(err) {
      return next(new Error('could not parse query.load: ' + req.query.load))
    }
    next()
  }

  function _extract_paging(req) { // default pageinfo extractor
    return {
      page: req.query.page,
      pagesize: req.query.pagesize
    }
  }

  function _paging_query(req, res, next) {
    const pinfo = opts.pageinfo_extractor ?
      opts.pageinfo_extractor(req) : _extract_paging(req)
    const page = parseInt(pinfo.page)
    if (pinfo.page && (isNaN(page) || page <= 0)) {
      return next(new Error('wrong page'))
    }
    const pagesize = parseInt(pinfo.pagesize)
    if (pinfo.pagesize && (isNaN(pagesize) || pagesize <= 0)) {
      return next(new Error('wrong pagesize'))
    }
    if (pinfo.page) {
      req.page = page
      req.pagesize = pagesize
    }
    next()
  }

  function _get_related_middleware(req, res, next) {
    res.json(req.fetchedrelated)  // just JSON back req.fetchedrelated
    next()
  }

  function _list_middleware(req, res, next) {
    let mod = new model()
    if(req.listquery) {
      mod = mod.query({where: req.listquery})
    }
    const fetchopts = {}
    if (req.loadquery) {
      fetchopts.withRelated = req.loadquery
    }
    if (req.page) {
      fetchopts.page = req.page
      fetchopts.pageSize = req.pagesize
    }
    const fetchMethod = req.page === undefined ? mod.fetchAll : mod.fetchPage
    fetchMethod.bind(mod)(fetchopts).then(function(collection) {
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
    req.fetchedrelated.invokeThen('destroy')
    .then((deleted) => {
      res.status(200).send('deleted')
      next()
    })
    .catch(next)
  }

  function _update_relation_middleware(req, res, next) {
    req.fetchedrelated.map((i) => {
      i.set(req.body)   // updated values
    })
    req.fetchedrelated.invokeThen('save')
    .then((saved) => {
      res.status(200).json(saved)
      next()
    })
    .catch(next)
  }

  function _fetch_related_middleware(req, res, next) {
    const relation = req.fetched.related(req.params.relation)
    const mod = relation.model.collection()
    const q = mod.query({where: req.query || {}})
    const fetchopts = (req.page) ? {page: req.page, pageSize: req.pagesize} : {}
    const fetch = (req.page !== undefined) ? q.fetchPage : q.fetch
    fetch.bind(q)(fetchopts).then((found) => {
      req.fetchedrelated = found
      next()
    })
    .catch(next)
  }

  function _fetch_middleware(req, res, next) {
    var mod = new model({id: req.params.id})
    const fetchopts = {
      require: true
    }
    if (req.loadquery) {
      fetchopts.withRelated = req.loadquery
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
    app.get('/', _list_query, _paging_query, _load_query, _list_middleware)
    app.get('/:id', _load_query, _fetch_middleware, _detail_middleware)
    app.post('/', _create_middleware)
    app.put('/:id', _fetch_middleware, _update_middleware)
    app.delete('/:id', _fetch_middleware, _delete_middleware)
    // relations
    app.get('/:id/:relation', _fetch_middleware, _paging_query, _fetch_related_middleware, _get_related_middleware)
    app.post('/:id/:relation', _fetch_middleware, _create_relation_middleware)
    app.put('/:id/:relation', _fetch_middleware, _fetch_related_middleware, _update_relation_middleware)
    app.delete('/:id/:relation', _fetch_middleware, _fetch_related_middleware, _delete_relation_middleware)
  }

  return {
    init_app: _init_app,
    list_query: _list_query,
    load_query: _load_query,
    get_related_middleware: _get_related_middleware,
    list_middleware: _list_middleware,
    detail_middleware: _detail_middleware,
    create_middleware: _create_middleware,
    create_relation_middleware: _create_relation_middleware,
    delete_relation_middleware: _delete_relation_middleware,
    fetch_related_middleware: _fetch_related_middleware,
    update_relation_middleware: _update_relation_middleware,
    fetch_middleware: _fetch_middleware,
    update_middleware: _update_middleware,
    delete_middleware: _delete_middleware,
    paging_query: _paging_query
  }

}
