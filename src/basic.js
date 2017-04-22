
module.exports = function(model) {

  function _list_middleware(req, res, next) {
    let mod = new model()
    if(req.query) {
      mod = mod.query({where: req.query})
    }
    if(req.sortCol) {
      mod = mod.orderBy(req.sortCol, req.sortOrder)
    }
    const fetchopts = {}
    if (req.loadquery) {
      fetchopts.withRelated = req.loadquery
    }
    if (req.page) {
      fetchopts.page = req.page
      fetchopts.pageSize = req.pagesize
    }
    if (req.columns4fetch) {
      fetchopts.columns = req.columns4fetch
    }
    const fetchMethod = req.page === undefined ? mod.fetchAll : mod.fetchPage
    fetchMethod.bind(mod)(fetchopts).then(function(collection) {
      if (collection.pagination) {
        res.set('x-total-count', collection.pagination.rowCount)
      }
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

  return {
    fetch: _fetch_middleware,
    list: _list_middleware,
    detail: _detail_middleware,
    create: _create_middleware,
    update: _update_middleware,
    delete: _delete_middleware
  }

}
