
module.exports = function(model) {

  function _get_related_middleware(req, res, next) {
    if (req.fetchedrelated.pagination) {
      res.set('x-total-count', req.fetchedrelated.pagination.rowCount)
    }
    res.json(req.fetchedrelated)  // just JSON back req.fetchedrelated
    next()
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
    const where = req.query || {}
    where[relation.relatedData.foreignKey] = relation.relatedData.parentFk
    let q = relation.model.collection().query({where: where})
    if(req.sortCol) {
      q = q.orderBy(req.sortCol, req.sortOrder)
    }
    const fetchopts = (req.page) ? {page: req.page, pageSize: req.pagesize} : {}
    if (req.columns4fetch) {
      fetchopts.columns = req.columns4fetch
    }
    const fetch = (req.page !== undefined) ? q.fetchPage : q.fetch
    fetch.bind(q)(fetchopts).then((found) => {
      req.fetchedrelated = found
      next()
    })
    .catch(next)
  }

  return {
    get_related_middleware: _get_related_middleware,
    create_relation_middleware: _create_relation_middleware,
    delete_relation_middleware: _delete_relation_middleware,
    fetch_related_middleware: _fetch_related_middleware,
    update_relation_middleware: _update_relation_middleware
  }

}
