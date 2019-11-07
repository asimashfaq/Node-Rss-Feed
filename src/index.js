import path from 'path'
import fs from 'fs'
import csv from 'csv-parser'
import {
    ParseFeed,
    RequestCount,
    results,
    DataCount,
    retry,
    RequestProcessdCount,
    FailedCount
} from './parser'

const { Worker } = require('worker_threads')
console.time('program_duration')

// change the count to the number of workers you wanted to run.
const WORKER_COUNT = 5
const workers = []

var regex = new RegExp(
    '^(http[s]?:\\/\\/(www\\.)?|ftp:\\/\\/(www\\.)?|www\\.){1}([0-9A-Za-z-\\.@:%_+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?'
)
ParseFeed('https://couplegoals.podbean.com/feed.xml', workers, WORKER_COUNT)
fs.createReadStream(path.join(__dirname, '../RSS-large-sample.csv'))
    .pipe(csv())
    .on('data', row => {
        console.time(row.RSS)
        if (regex.test(row.RSS)) {
            // ParseFeed(row.RSS, workers, WORKER_COUNT)
        } else {
            console.log('Not a valid Url')
        }
        console.timeEnd(row.RSS)
    })
    .on('end', () => {
        console.log('CSV file successfully processed')
    })

// Create the workes
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

// Receive Messages from the Workers
function hanleWorkerMessages(data) {
    results.push(data)
    //console.log(results)
}

setInterval(() => {
    console.log(`
        Total Result Added : ${results.length} 
        Expected Data : ${DataCount()}
        Requests Send : ${RequestCount()}
        Requests Processed : ${RequestProcessdCount()}
        Failed Request : ${FailedCount()}
    `)
    if (
        DataCount() == results.length &&
        RequestCount() == RequestProcessdCount() + FailedCount()
    ) {
        workCompleted()
    }
}, 1000)

for (let i = 0; i < WORKER_COUNT; i++) {
    workers[i] = createWorker(`worker${i}`, i)
}

// Retry the Links Due to Http Errors
const retryUrl = () => {
    if (retry.length > 0) {
        console.log(`RetryQuey: `, retry)
        const url = retry.shift()
        console.log(`Retry ${url}`)
        ParseFeed(url, workers, WORKER_COUNT)
        retryUrl()
    } else {
        if (REQUEST_COUNT == 0) {
            workCompleted()
            console.log('Total Record save', dataCount)
        }
    }
}

// Clean up Function
function workCompleted() {
    for (let i = 0; i < WORKER_COUNT; i++) {
        workers[i].removeListener('message', workCompleted)
        workers[i].unref()
    }
    console.timeEnd('program_duration')
    process.exit(0)
}
