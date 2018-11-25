const fs = require('fs')
const path = require('path')
const helpers = require('./helpers')
const lib = {}

lib.baseDir = path.join(__dirname, '/../.data/')

lib.create = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fileDescriptor) => {
        if (err) return callback('Could not create new file, it may already exist')
        // Convert data to string
        const stringData = JSON.stringify(data)
        // Write to file and close it
        fs.writeFile(fileDescriptor, stringData, (err) => {
            if (err) return callback('Error writing to new file')
            fs.close(fileDescriptor, (err) => {
                if (err) return callback('Error closing new file')
                callback(false)
            })
        })
    })
}

lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', (err, data) => {
        if (err) return callback(err, data)
        const parsedData = helpers.parseJsonToObject(data)
        callback(false, parsedData)
    })
}

lib.update = (dir, file, data, callback) => {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fileDescriptor) => {
        if (err) return callback('Could not open file for updating, it may not exist yet')
        // Convert data to string
        const stringData = JSON.stringify(data)
        // Truncate the file
        fs.truncate(fileDescriptor, function (err) {
            if (err) return callback('Error truncating file')
            // Write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
                if (err) return callback('Error writing to existing file')
                fs.close(fileDescriptor, (err) => {
                    if (err) return callback('Error closing existing file')
                    callback(false)
                })
            })
        })
    })
}

lib.delete = (dir, file, callback) => {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', (err) => {
        if(err) return callback(err)
        callback(false)
    })
}

module.exports = lib