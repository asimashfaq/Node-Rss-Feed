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
            if (data.episodes == undefined) {
                workers[0].postMessage({
                    data,
                    hash: urlHash
                })
                dataCount++
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
