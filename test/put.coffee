
chai = require('chai')
should = chai.should()

module.exports = (g)->

  r = chai.request(g.baseurl)

  describe 'put routes', ->

    it 'must update user', () ->
      r.put("/#{g.gandalfID}").send({ name: 'gandalfek' }).then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.name.should.eql 'gandalfek'
        res.body.id.should.eql g.gandalfID

    it 'must change magicwand to supermagicwand', () ->
      return r.put("/#{g.gandalfID}/tools?id=#{g.magicwandid}")
      .send({ type: 'supermagicwand' })
      .then (res) ->
        res.should.have.status(200)
        # verify that gandalf has now supermagicwand
        return r.get("/#{g.gandalfID}?_load=tools")
      .then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.tools[0].type.should.eql 'supermagicwand'
