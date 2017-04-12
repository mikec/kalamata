
chai = require('chai')
should = chai.should()

module.exports = (g)->

  addr = g.baseurl

  describe 'delete routes', ->

    it 'must delete user', (done) ->
      chai.request(g.baseurl)
      .delete("/#{g.gandalfID}")
      .end (err, res) ->
        return done(err) if err
        res.should.have.status(200)
        chai.request(g.baseurl).get("/#{g.gandalfID}").end (err, res) ->
          return done('still exist') if not err
          res.should.have.status(404)
          done()
      return

    it 'must 404 on notexisting user', (done) ->
      chai.request(g.baseurl)
      .delete("/hovno")
      .end (err, res) ->
        return done('shall 404 but have not') if not err
        res.should.have.status(404)
        done()
