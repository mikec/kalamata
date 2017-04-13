
chai = require('chai')
should = chai.should()

module.exports = (g)->

  addr = g.baseurl

  describe 'post routes', ->

    it 'must get gandalfs tools - []', (done) ->
      chai.request(g.baseurl).get("/#{g.gandalfID}/tools").end (err, res) ->
        return done(err) if err
        res.should.have.status(200)
        res.should.be.json
        res.body.should.eql []
        done()
      return

    it 'must add an axe to gandalf', (done) ->
      chai.request(g.baseurl)
      .post("/#{g.gandalfID}/tools")
      .send({ type: 'axe' })
      .end (err, res) ->
        return done(err) if err
        res.should.have.status(201)
        res.should.be.json
        res.body.type.should.eql 'axe'
        done()
      return
