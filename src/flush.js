const redis = require('redis')
const config = require('./config/enviornment').config
var client = redis.createClient(6379, '0.0.0.0')
var MongoClient = require('mongodb').MongoClient
var url = config.get('mongoUrl')
console.log(url)
MongoClient.connect(url, { useUnifiedTopology: true }, function(err, db) {
    if (err) throw err
    var dbo = db.db('admin')
    dbo.dropCollection('feeds', function(err, delOK) {
        if (err) throw err
        if (delOK) console.log('Collection deleted')
        db.close()
    })
    dbo.dropCollection('episodes', function(err, delOK) {
        if (err) throw err
        if (delOK) console.log('Collection deleted')
        db.close()
        process.exit(0)
    })
})

client.on('connect', () => {
    console.log('Redis client connected')
    client.flushdb(function(err, succeeded) {
        console.log(succeeded) // will be true if successfull
    })
})
client.on('error', err => {
    console.log('Something went wrong ' + err)
})
