const bodyParser = require('body-parser')
const express = require('express')
const chai = require('chai')
const chaiHttp = require('chai-http')
chai.use(chaiHttp)
const should = chai.should()

const db = require('./db')
const Kalamata = require('../src/index')

process.env.SERVER_SECRET = 'fhdsakjhfkjal'
port = process.env.PORT || 3333
const g = {}

// entry ...
describe('app', (suite) => {

  g.app = app = express()
  app.use(bodyParser.json())
  g.db = db

  const k = Kalamata(db.models.User, {
    createError: (message, status = 400) => {
      return new Error({status: status, message: message})
    }
  })
  k.init_app(app)  // create the REST routes
  app.use((err, req, res, next) => {
    if (err.message === 'EmptyResponse') {
      return res.status(404).send(err)
    }
    const statusCode = parseInt(err.message)
    res.status(isNaN(statusCode) ? 400 : statusCode).send(err)
    console.log(err)
  })

  before((done) => {
    g.db.migrate.latest()
    .then(() => {
      // init server
      g.server = app.listen(port, (err) => {
        if (err) return done(err)
        done()
      })
    })
    .catch(done)
  })

  after((done) => {
    g.server.close()
    done()
  })

  it('should exist', (done) => {
    should.exist(g.app)
    should.exist(k.sorting_q)
    should.exist(k.list)
    should.exist(k.create_rel)
    done()
  })

  // run the rest of tests
  g.baseurl = `http://localhost:${port}`

  const submodules = [
    './post',
    './put',
    './get',
    './del'
  ]
  submodules.forEach((i) => {
    const SubMod = require(i)
    SubMod(g)
  })

})
