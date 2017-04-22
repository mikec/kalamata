
chai = require('chai')
should = chai.should()

module.exports = (g)->

  r = chai.request(g.baseurl)

  describe 'post routes', ->

    it 'must create user', () ->
      r.post('/').send({ name: 'gandalf' }).then (res) ->
        res.should.have.status(201)
        res.should.be.json
        res.body.name.should.eql 'gandalf'
        g.gandalfID = res.body.id

    it 'must get gandalfs tools - []', () ->
      r.get("/#{g.gandalfID}/tools").then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.should.eql []

    it 'must add an magicwand and hat to gandalf', () ->
      r.post("/#{g.gandalfID}/tools").send({ type: 'magicwand' })
      .then (res) ->
        res.should.have.status(201)
        res.should.be.json
        res.body.type.should.eql 'magicwand'
        g.magicwandid = res.body.id
        return r.post("/#{g.gandalfID}/tools").send({ type: 'hat' })
      .then (res) ->
        res.should.have.status(201)
        res.should.be.json
        res.body.type.should.eql 'hat'

    it 'add another user, saruman', () ->
      r.post('/').send({ name: 'saruman' })
      .then (res) ->
        res.should.have.status(201)
        res.should.be.json
        g.sarumanID = res.body.id
        return r.post("/#{g.sarumanID}/tools").send({ type: 'fury' })
      .then (res) ->
        res.should.have.status(201)
        res.should.be.json
        res.body.type.should.eql 'fury'
