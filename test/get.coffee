
chai = require('chai')
should = chai.should()

module.exports = (g)->

  r = chai.request(g.baseurl)

  describe 'get routes', ->

    it 'must get all', () ->
      r.get('/').then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body[0].name.should.eql 'gandalfek'

    it 'must get gandalf', () ->
      r.get("/#{g.gandalfID}").then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.name.should.eql 'gandalfek'

    it 'must return gandalf with all tools (magicwand)', () ->
      r.get("/#{g.gandalfID}?load=tools").then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.tools.length.should.eql 2

    it 'must return all users with all tools', () ->
      r.get("/?load=tools").then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.length.should.eql 2
        res.body[0].tools.length.should.eql 2
        res.body[0].tools[0].type.should.eql 'supermagicwand'

    it 'must list 2nd page of users', () ->
      r.get('/?page=2&pagesize=1').then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.length.should.eql 1
        res.body[0].name.should.eql 'saruman'
        res.headers['x-total-count'].should.eql '2'

    it 'must list 2nd page of users but only names', () ->
      r.get('/?page=2&pagesize=1&attrs=name').then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.length.should.eql 1
        Object.keys(res.body[0]).length.should.eql 1
        res.body[0].name.should.eql 'saruman'

    it 'must list 2nd page of gandalf thigs', () ->
      r.get("/#{g.gandalfID}/tools/?page=2&pagesize=1").then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.length.should.eql 1
        res.body[0].type.should.eql 'hat'
        res.headers['x-total-count'].should.eql '2'

    it 'must list users sorted according name', () ->
      r.get("/?sortCol=name&sortOrder=DESC").then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.length.should.eql 2
        res.body[0].name.should.eql 'saruman'
        res.body[1].name.should.eql 'gandalfek'

    it 'must list gandalf thigs', () ->
      r.get("/#{g.gandalfID}/tools/?sortCol=type&sortOrder=ASC").then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.length.should.eql 2
        res.body[0].type.should.eql 'hat'
        res.body[1].type.should.eql 'supermagicwand'

    it 'must list gandalf thig types and ids ONLY', () ->
      r.get("/#{g.gandalfID}/tools/?sortCol=type&sortOrder=ASC&attrs=type,id")
      .then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.length.should.eql 2
        Object.keys(res.body[0]).length.should.eql 2  # type,id
        res.body[0].type.should.eql 'hat'
        res.body[1].type.should.eql 'supermagicwand'
