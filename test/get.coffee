
chai = require('chai')
should = chai.should()

module.exports = (g)->

  addr = g.baseurl

  describe 'post routes', ->

    it 'must get all', (done) ->
      chai.request(g.baseurl).get('/').end (err, res) ->
        return done(err) if err
        res.should.have.status(200)
        res.should.be.json
        res.body[0].name.should.eql 'gandalfek'
        done()
      return

    it 'must get gandalf', (done) ->
      chai.request(g.baseurl).get("/#{g.gandalfID}").end (err, res) ->
        return done(err) if err
        res.should.have.status(200)
        res.should.be.json
        res.body.name.should.eql 'gandalfek'
        done()
      return
