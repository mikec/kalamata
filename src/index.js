
module.exports = function(model, opts) {

  if (! opts.createError) {
    throw new Error('mandatory function createError not provided in opts :/')
  }

  const q = require('./preparation')(opts)
  const basic = require('./basic')(model)
  const related = require('./related')(model)

  function _init_app(app) {
    app.get('/', q.paging_q, q.sorting_q, q.load_q, q.attrs_q, basic.list)
    app.get('/:id', q.load_q, basic.fetch, basic.detail)
    app.post('/', basic.create)
    app.put('/:id', basic.fetch, basic.update)
    app.delete('/:id', basic.fetch, basic.delete)
    // relations
    app.get('/:id/:relation',
      basic.fetch, q.paging_q, q.sorting_q, q.attrs_q,
      related.fetch_rel, related.get_rel
    )
    app.post('/:id/:relation', basic.fetch, related.create_rel)
    app.put('/:id/:relation', basic.fetch, related.fetch_rel, related.update_rel)
    app.delete('/:id/:relation', basic.fetch, related.fetch_rel, related.delete_rel)
  }

  return Object.assign({init_app: _init_app}, q, basic, related)
}
