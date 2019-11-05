import request from 'request'
import parsePodcast from 'node-podcast-parser'
import path from 'path'
import fs from 'fs'
const { Worker } = require('worker_threads')

// change the count to the number of workers you wanted to run.
const WORKER_COUNT = 2
// url to load the feeds from.
const URL = 'https://www.spreaker.com/show/3202978/episodes/feed'

const workers = []
let results = []
let dataCount = 0

console.time('program duration')

const createWorker = (id, index) => {
    const worker = new Worker(path.join(__dirname, './worker.js'), {
        workerData: { id, index }
    })
    worker.on('error', err => {
        throw err
    })
    worker.on('message', hanleWorkerMessages)
    return worker
}
function hanleWorkerMessages(data) {
    results.push(data)
    if (results.length == dataCount) {
        workCompleted()
    }
}
function workCompleted() {
    console.timeEnd('save duration')
    for (let i = 0; i < WORKER_COUNT; i++) {
        workers[i].removeListener('message', callback)
        workers[i].unref()
    }
    console.log('Total Record save', dataCount)
    console.timeEnd('program duration')
}
for (let i = 0; i < WORKER_COUNT; i++) {
    workers[i] = createWorker(`worker${i}`, i)
}

request(URL, (err, res, data) => {
    if (err) {
        console.error('Network error', err)
        return
    }
    parsePodcast(data, (err, data) => {
        console.time('save duration')
        if (err) {
            console.error('Parsing error', err)
            return
        }
        dataCount = data.episodes.length
        const episodes = [...data.episodes]
        while (episodes.length > 0) {
            for (let i = 0; i < WORKER_COUNT; i++) {
                const episode = episodes.shift()
                if (episode != undefined) {
                    workers[i].postMessage(episode)
                }
            }
        }
    })
})

const generateJson = data => {
    fs.writeFile('output.json', JSON.stringify(data), 'utf8', function(err) {
        if (err) {
            console.log('An error occured while writing JSON Object to File.')
            return console.log(err)
        }

        console.log('JSON file has been saved.')
    })
}
