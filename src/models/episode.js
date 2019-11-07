const mongoose = require('mongoose')

const episodeSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true
    },
    published: {
        type: Date
    },
    hash: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    urlHash: {
        type: String
    },
    guid: {
        type: String
    },
    description: {
        type: String
    },
    episode: {
        type: String
    },
    image: {
        type: String
    },
    duration: {
        type: Number
    },
    episodeType: {
        type: String
    },
    enclosure: {
        url: {
            type: String
        },
        type: {
            type: String
        },
        filesize: {
            type: Number
        }
    },
    feedHash: {
        type: String
    }
})
const episodes = mongoose.model('episodes', episodeSchema)
module.exports = episodes
