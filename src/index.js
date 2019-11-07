import request from 'request'
import parsePodcast from 'node-podcast-parser'
import path from 'path'
import fs from 'fs'
import csv from 'csv-parser'

const { hash } = require('./utils')
const { Worker } = require('worker_threads')
console.time('program_duration')
const redis = require('redis')
// change the count to the number of workers you wanted to run.
const WORKER_COUNT = 5

var client = redis.createClient(6379, '0.0.0.0')
client.on('connect', () => {
    console.log('Redis client connected')
})
client.on('error', err => {
    console.log('Something went wrong ' + err)
})
const workers = []
let results = []
let dataCount = 0
let retry = []
let REQUEST_COUNT = 0

var regex = new RegExp(
    '^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?'
)

fs.createReadStream(path.join(__dirname, '../RSS-large-sample.csv'))
    .pipe(csv())
    .on('data', row => {
        console.time(row.RSS)
        if (regex.test(row.RSS)) {
            // ParseFeed(row.RSS)
        } else {
            console.log('Not a valid Url')
        }
        console.timeEnd(row.RSS)
    })
    .on('end', () => {
        console.log('CSV file successfully processed')
    })

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
    //console.log(results)
}

setInterval(() => {
    console.log(retry, results.length, dataCount, REQUEST_COUNT)
    if (results.length == dataCount && REQUEST_COUNT == 0) {
        retryUrl()
    }
}, 1000)
function workCompleted() {
    for (let i = 0; i < WORKER_COUNT; i++) {
        workers[i].removeListener('message', workCompleted)
        workers[i].unref()
    }
    console.timeEnd('program_duration')
    process.exit(0)
}
const retryUrl = () => {
    if (retry.length > 0) {
        console.log(`RetryQuey: `, retry)
        const url = retry.shift()
        console.log(`Retry ${url}`)
        ParseFeed(url)
        retryUrl()
    } else {
        if (REQUEST_COUNT == 0) {
            workCompleted()
            console.log('Total Record save', dataCount)
        }
    }
}

for (let i = 0; i < WORKER_COUNT; i++) {
    workers[i] = createWorker(`worker${i}`, i)
}

const ParseFeed = async url => {
    var options = {
        url: url.trim(),
        timeout: 35000
    }
    REQUEST_COUNT++
    console.log(`Request Count ${REQUEST_COUNT}`)
    request(options, (error, response, body) => {
        REQUEST_COUNT--
        console.log(`Request: ${REQUEST_COUNT}`)
        if (error) {
            if (body == undefined) {
                console.log('Rate limit', url, error)
                retry.push(url)
                console.log('Retry Qeue', retryUrl.length)
                return
            }
            console.log(',,,,,', options)

            return
        }
        if (response.statusCode == 404) {
            console.log('not found')
            return
        }

        if (response.statusCode == 403) {
            console.log('forbidden')
            return
        }
        if (response.statusCode == 406) {
            console.log('cloudflare limit')
            return
        }
        if (response.statusCode == 400) {
            console.log('bad data')
            return
        }
        if (response.statusCode !== 200) {
            console.log(response.statusCode, url, body)
            console.log('Goes Wrong')
            retry.push(url)
            return
        }
        parsePodcast(body, (err, data) => {
            if (err) {
                console.log(',,,,,', response.request.href)
                console.log(',,,', body)
                console.error('Parsing error', err)
                return
            }
            const urlHash = hash(url)
            const dataHash = hash(data)
            if (data.episodes == undefined) {
                //console.log(response.request.href)
                //console.log(data)
                return
            }
            dataCount += data.episodes.length
            client.get(urlHash, value => {
                if (true) {
                    //if (value !== dataHash) {
                    // do the processing
                    //client.set(urlHash, dataHash)
                    const episodes = [...data.episodes]
                    while (episodes.length > 0) {
                        for (let i = 0; i < WORKER_COUNT; i++) {
                            const episode = episodes.shift()

                            if (episode != undefined) {
                                //console.log(episode)
                                workers[i].postMessage({
                                    episode,
                                    hash: hash(episode)
                                })
                            }
                        }
                    }
                } else {
                    const episodes = [...data.episodes]
                    while (episodes.length > 0) {
                        const episode = episodes.shift()
                        results.push({ id: episode.episode, success: true })
                    }
                }
            })
        })
    })
}
ParseFeed(
    'https://americaoutloud.com/category/podcast/blue-lives-radio/feed/podcast/'
)
