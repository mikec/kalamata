
chai = require('chai')
should = chai.should()

module.exports = (g)->

  addr = g.baseurl

  describe 'put routes', ->

    it 'must update user', (done) ->
      chai.request(g.baseurl)
      .put("/#{g.gandalfID}")
      .send({ name: 'gandalfek' })
      .end (err, res) ->
        return done(err) if err
        res.should.have.status(200)
        res.should.be.json
        res.body.name.should.eql 'gandalfek'
        res.body.id.should.eql g.gandalfID
        done()
      return

    # it 'must add a tool to gandalf', (done) ->
    #   chai.request(g.baseurl)
    #   .post("#{g.gandalfID}/things")
    #   .send({ type: 'magicwand' })
    #   .end (err, res) ->
    #     return done(err) if err
    #     res.should.have.status(200)
    #     res.should.be.json
    #     res.body.type.should.eql 'magicwand'
    #     done()
