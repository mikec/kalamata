
module.exports = function(opts) {

  function _load_query(req, res, next) {
    try {
      req.loadquery = req.query._load ? req.query._load.split(',') : []
      delete req.query._load
    } catch(err) {
      return next(opts.createError('could not parse query._load'))
    }
    next()
  }

  function _extract_paging(req) { // default pageinfo extractor
    if (req.query._page && req.query._pagesize) {
      const i = {
        page: req.query._page,
        pagesize: req.query._pagesize
      }
      delete req.query._page
      delete req.query._pagesize
      return i
    }
  }

  function _paging_query(req, res, next) {
    const pinfo = opts.pageinfo_extractor ?
      opts.pageinfo_extractor(req) : _extract_paging(req)
    if (pinfo) {
      const page = parseInt(pinfo.page)
      if (isNaN(page) || page <= 0) {
        return next(opts.createError('wrong page'))
      }
      const pagesize = parseInt(pinfo.pagesize)
      if (isNaN(pagesize) || pagesize <= 0) {
        return next(opts.createError('wrong pagesize'))
      }
      req.page = page
      req.pagesize = pagesize
    }
    next()
  }

  function _extract_sorting(req) { // default sortinginfo extractor
    if (req.query._sortCol && req.query._sortOrder) {
      const i = {
        sortCol: req.query._sortCol,
        sortOrder: req.query._sortOrder
      }
      delete req.query._sortCol
      delete req.query._sortOrder
      return i
    }
  }

  function _sorting_query(req, res, next) {
    const info = opts.sortinfo_extractor ?
      opts.sortinfo_extractor(req) : _extract_sorting(req)
    if (info) {
      if (! info.sortCol || info.sortCol.length === 0) {
        return next(opts.createError('wrong sorting column'))
      }
      if (! info.sortOrder.match(/^ASC$|^DESC$/)) {
        return next(opts.createError('wrong sort order'))
      }
      req.sortCol = info.sortCol
      req.sortOrder = info.sortOrder
    }
    next()
  }

  function _attrs_query(req, res, next) {
    if (req.query._attrs) {
      req.columns4fetch = req.query._attrs.split(',')
      delete req.query._attrs
    }
    next()
  }

  return {
    attrs_query: _attrs_query,
    load_query: _load_query,
    paging_query: _paging_query,
    sorting_query: _sorting_query
  }

}
