const { hash } = require('./utils')
const { parentPort, workerData } = require('worker_threads')
const { id, index } = workerData

parentPort.on('message', msg => {
    if (msg) {
        //console.log(msg)
        parentPort.postMessage({ id: msg.episode.episode, save: true })
        return
    }
    throw new Error(
        `Unknown message: ${msg} Workder Name : ${id} index ${index}`
    )
})
