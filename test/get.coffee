
chai = require('chai')
should = chai.should()

module.exports = (g)->

  addr = g.baseurl

  describe 'get routes', ->

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

    it 'must return gandalf with all tools (magicwand)', (done) ->
      chai.request(g.baseurl)
      .get("/#{g.gandalfID}?load=tools")
      .end (err, res) ->
        return done(err) if err
        res.should.have.status(200)
        res.should.be.json
        res.body.tools.length.should.eql 2
        done()
      return

    it 'must return all users with all tools', (done) ->
      chai.request(g.baseurl)
      .get("/?load=tools")
      .end (err, res) ->
        return done(err) if err
        res.should.have.status(200)
        res.should.be.json
        res.body.length.should.eql 1
        res.body[0].tools.length.should.eql 2
        res.body[0].tools[0].type.should.eql 'supermagicwand'
        done()
      return

    it 'must list 2nd page of users', (done) ->
      # add another user
      chai.request(g.baseurl)
      .post('/')
      .send({ name: 'saruman' })
      .end (err, res) ->
        return done(err) if err
        res.should.have.status(201)
        res.should.be.json
        g.sarumanID = res.body.id
        # list 2nd page
        chai.request(g.baseurl).get('/?page=2&pagesize=1').end (err, res) ->
          return done(err) if err
          res.should.have.status(200)
          res.should.be.json
          res.body.length.should.eql 1
          res.body[0].name.should.eql 'saruman'
          done()
        return

    it 'must list 2nd page of gandalf thigs', () ->
      return chai.request(g.baseurl)
      .get("/#{g.gandalfID}/tools/?page=2&pagesize=1")
      .then (res) ->
        res.should.have.status(200)
        res.should.be.json
        res.body.length.should.eql 1
        res.body[0].name.should.eql 'saruman'
