const { hash } = require('./utils')
const { parentPort, workerData } = require('worker_threads')
const { id, index } = workerData
const { init } = require('./service/monogodb')
init()
const Feed = require('./models/feed')
const Episode = require('./models/episode')
const redis = require('redis')
var client = redis.createClient(6379, '0.0.0.0')
client.on('connect', () => {
    console.log('Redis client connected')
})
client.on('error', err => {
    console.log('Something went wrong ' + err)
})

parentPort.on('message', async msg => {
    if (msg) {
        try {
            if (msg != undefined) {
                if (msg.type == 'Feed') {
                    const urlHash = hash(msg.url)

                    const feed = msg.data
                    feed.urlHash = urlHash
                    feed.hash = hash(msg.data)
                    Feed.findOneAndUpdate(
                        { urlHash: urlHash },
                        feed,
                        { new: true, upsert: true, setDefaultsOnInsert: true },
                        function(error, result) {
                            if (error) {
                                console.log(
                                    'Something wrong when updating data!',
                                    error
                                )
                            }
                        }
                    )
                    parentPort.postMessage({ save: true })
                    return
                }

                const episode = msg.episode
                const urlHash = hash(msg.url + episode.episode)
                episode.hash = hash(msg.episode)
                episode.urlHash = urlHash
                episode.feedHash = msg.feedHash
                client.get(urlHash, async (err, value) => {
                    if (value != episode.hash) {
                        client.set(urlHash, episode.hash)
                        Episode.findOneAndUpdate(
                            { urlHash: urlHash },
                            episode,
                            {
                                new: true,
                                upsert: true,
                                setDefaultsOnInsert: true
                            },
                            function(error, result) {
                                if (error) {
                                    console.log(
                                        'Something wrong when updating data!'
                                    )
                                }
                            }
                        )
                    }
                })
                console.log('send rpely')
                parentPort.postMessage({
                    save: true
                })
                return
            }
        } catch (e) {
            console.log(e)
            parentPort.postMessage({ url: msg.url, save: false })
        }
        //
        return
    }
    throw new Error(
        `Unknown message: ${msg} Workder Name : ${id} index ${index}`
    )
})
