
module.exports = function(opts) {

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
    const i = {
      page: req.query.page,
      pagesize: req.query.pagesize
    }
    delete req.query.page
    delete req.query.pagesize
    return i
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

  function _extract_sorting(req) { // default sortinginfo extractor
    if (req.query.sortCol && req.query.sortOrder) {
      const i = {
        sortCol: req.query.sortCol,
        sortOrder: req.query.sortOrder
      }
      delete req.query.sortCol
      delete req.query.sortOrder
      return i
    }
  }

  function _sorting_query(req, res, next) {
    const info = opts.sortinfo_extractor ?
      opts.sortinfo_extractor(req) : _extract_sorting(req)
    if (info) {
      if (! info.sortCol || info.sortCol.length === 0) {
        return next(new Error('wrong sorting column'))
      }
      if (! info.sortOrder.match(/^ASC$|^DESC$/)) {
        return next(new Error('wrong sort order'))
      }
      req.sortCol = info.sortCol
      req.sortOrder = info.sortOrder
    }
    next()
  }

  function _attrs_query(req, res, next) {
    if (req.query.attrs) {
      req.columns4fetch = req.query.attrs.split(',')
      delete req.query.attrs
    }
    next()
  }

  return {
    attrs_query: _attrs_query,
    list_query: _list_query,
    load_query: _load_query,
    paging_query: _paging_query,
    sorting_query: _sorting_query
  }

}
