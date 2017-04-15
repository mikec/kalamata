
chai = require('chai')
should = chai.should()

module.exports = (g)->

  r = chai.request(g.baseurl)

  describe 'put routes', ->

    it 'must update user', (done) ->
      r.put("/#{g.gandalfID}")
      .send({ name: 'gandalfek' })
      .end (err, res) ->
        return done(err) if err
        res.should.have.status(200)
        res.should.be.json
        res.body.name.should.eql 'gandalfek'
        res.body.id.should.eql g.gandalfID
        done()
      return

    it 'must change magicwand to supermagicwand', () ->
      return r.put("/#{g.gandalfID}/tools?id=#{g.magicwandid}")
      .send({ type: 'supermagicwand' })
      .then (res) ->
        res.should.have.status(200)
        # verify that gandalf has now supermagicwand
        return chai.request(g.baseurl).get("/#{g.gandalfID}?load=tools")
      .then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.tools[0].type.should.eql 'supermagicwand'
