const SHA256 = require('crypto-js/sha256')
const hash = data => {
    return SHA256(JSON.stringify(data)).toString()
}

const generateJson = data => {
    fs.writeFile('output.json', JSON.stringify(data), 'utf8', function(err) {
        if (err) {
            console.log('An error occured while writing JSON Object to File.')
            return console.log(err)
        }

        console.log('JSON file has been saved.')
    })
}

module.exports = {
    hash: hash,
    generateJson: generateJson
}
