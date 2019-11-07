import request from 'request'
import parsePodcast from 'node-podcast-parser'
const redis = require('redis')
const { hash } = require('./utils')

let REQUEST_COUNT = 0
let REQUEST_PROCESSED_COUNT = 0
let FAILED_COUNT = 0
let results = []
let dataCount = 0
let retry = []
var client = redis.createClient(6379, '0.0.0.0')
client.on('connect', () => {
    console.log('Redis client connected')
    /*client.set(
        '39f443f7c55a4e2454f25cce806a81665d3150d01ab36b47194e17f6094900d1',
        ''
    )*/
})
client.on('error', err => {
    console.log('Something went wrong ' + err)
})

const ParseFeed = async (url, workers, WORKER_COUNT) => {
    var options = {
        url: url.trim(),
        timeout: 35000
    }
    REQUEST_COUNT++
    request(options, (error, response, body) => {
        if (error) {
            FAILED_COUNT++
            if (body == undefined) {
                console.log('Rate limit', url, error)
                retry.push(url)
                console.log('Retry Qeue', retry.length)
                return
            }
            console.log(',,,,,', options)

            return
        }
        if (response.statusCode == 404) {
            FAILED_COUNT++
            console.log('not found')
            return
        }

        if (response.statusCode == 403) {
            FAILED_COUNT++
            console.log('forbidden')
            return
        }
        if (response.statusCode == 406) {
            FAILED_COUNT++
            console.log('cloudflare limit')
            return
        }
        if (response.statusCode == 400) {
            FAILED_COUNT++
            console.log('bad data')
            return
        }
        if (response.statusCode !== 200) {
            FAILED_COUNT++
            console.log(response.statusCode, url, body)
            console.log('Goes Wrong')
            retry.push(url)
            return
        }
        REQUEST_PROCESSED_COUNT++
        parsePodcast(body, (err, data) => {
            if (err) {
                console.log(',,,,,', response.request.href)
                console.log(',,,', body)
                console.error('Parsing error', err)
                return
            }
            const urlHash = hash(url)
            const dataHash = hash(data)
            console.log(urlHash, dataHash)
            if (data.episodes == undefined) {
                workers[0].postMessage({
                    data,
                    type: 'Feed',
                    hash: urlHash
                })
                dataCount++
                //console.log(response.request.href)
                //console.log(data)
                return
            }

            client.get(urlHash, (err, value) => {
                if (value !== dataHash) {
                    client.set(urlHash, dataHash, redis.print)
                    // do the processing
                    workers[0].postMessage({
                        data,
                        type: 'Feed'
                    })
                    dataCount++
                    dataCount += data.episodes.length

                    const episodes = [...data.episodes]
                    while (episodes.length > 0) {
                        for (let i = 1; i < WORKER_COUNT; i++) {
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
                    console.log('Skipping Proccessing')
                }
            })
        })
    })
}

const RequestCount = () => {
    return REQUEST_COUNT
}
const DataCount = () => {
    return dataCount
}
const RequestProcessdCount = () => {
    return REQUEST_PROCESSED_COUNT
}
const FailedCount = () => {
    return FAILED_COUNT
}
module.exports = {
    ParseFeed: ParseFeed,
    RequestCount: RequestCount,
    DataCount: DataCount,
    results: results,
    retry: retry,
    RequestProcessdCount: RequestProcessdCount,
    FailedCount: FailedCount
}
