const { hash } = require('./utils')
const { parentPort, workerData } = require('worker_threads')
const { id, index } = workerData
const { init } = require('./service/monogodb')
init()
const Feed = require('./models/feed')
console.log(Feed)
parentPort.on('message', async msg => {
    if (msg) {
        //console.log(msg)
        if (msg != undefined) {
            if (msg.type == 'Feed') {
                const feed = new Feed(msg.data)
                feed.hash = hash(msg.data)
                await feed.save()
                parentPort.postMessage({ id: feed._id, save: true })
                return
            }

            parentPort.postMessage({ id: msg.episode.episode, save: true })
            return
        }
        parentPort.postMessage({ id: 12, save: true })
        return
    }
    throw new Error(
        `Unknown message: ${msg} Workder Name : ${id} index ${index}`
    )
})
