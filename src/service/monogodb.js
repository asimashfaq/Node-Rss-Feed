const mongoose = require('mongoose')
const config = require('../config/enviornment').config
const init = () => {
    mongoose.connect(process.env.MONGO_URL || config.get('mongoUrl'), {
        useNewUrlParser: true,
        useCreateIndex: true,
        useUnifiedTopology: true
    })

    const mongoDb = mongoose.connection

    mongoDb.on('error', () => {
        console.log(`Unable to connect to database: ${config.get('mongoUrl')}`)
    })

    mongoDb.once('open', () => {
        console.log('Connected to database')
    })
    mongoose.set('useFindAndModify', false)

    return mongoDb
}
module.exports = {
    init
}
