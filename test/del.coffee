
chai = require('chai')
should = chai.should()

module.exports = (g)->

  r = chai.request(g.baseurl)

  describe 'delete routes', ->

    it 'must delete relation (remove magicwand from gandalf)', () ->
      # remove magicwand
      return r.delete("/#{g.gandalfID}/tools?type=supermagicwand")
      .then (res) ->
        res.should.have.status(200)
        # verify gandalf is toolless
        return r.get("/#{g.gandalfID}?load=tools")
      .then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.tools.length.should.eql 1

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
      return
