
module.exports = function(model, opts) {

  opts = opts || {}

  const q = require('./preparation')(opts)
  const basic = require('./basic')(model)
  const related = require('./related')(model)

  function _init_app(app) {
    app.get('/',
      q.list_query, q.paging_query, q.sorting_query, q.load_query, q.attrs_query,
      basic.list_middleware
    )
    app.get('/:id', q.load_query, basic.fetch_middleware, basic.detail_middleware)
    app.post('/', basic.create_middleware)
    app.put('/:id', basic.fetch_middleware, basic.update_middleware)
    app.delete('/:id', basic.fetch_middleware, basic.delete_middleware)
    // relations
    app.get('/:id/:relation',
      basic.fetch_middleware, q.paging_query, q.sorting_query, q.attrs_query,
      related.fetch_related_middleware, related.get_related_middleware
    )
    app.post('/:id/:relation', basic.fetch_middleware,
      related.create_relation_middleware
    )
    app.put('/:id/:relation', basic.fetch_middleware,
      related.fetch_related_middleware, related.update_relation_middleware
    )
    app.delete('/:id/:relation', basic.fetch_middleware,
      related.fetch_related_middleware, related.delete_relation_middleware
    )
  }

  return Object.assign({init_app: _init_app}, q, basic, related)
}
