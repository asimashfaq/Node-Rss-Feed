const mongoose = require('mongoose')

const feedSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        index: true
    },
    link: {
        type: String
    },
    hash: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    language: {
        type: String
    },
    type: {
        type: String
    },
    author: {
        type: String
    },
    image: {
        type: String
    },
    description: {
        long: {
            type: String
        },
        short: {
            type: String
        }
    },
    owner: {
        name: {
            type: String
        },
        email: {
            type: String
        }
    },
    categories: [
        {
            type: String
        }
    ]
})
const feed = mongoose.model('feeds', feedSchema)
module.exports = feed
