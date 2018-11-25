const http = require('http')
const https = require('https')
const path = require('path')
const fs = require('fs')
const queryString = require('querystring')
const url = require('url')
const { StringDecoder } = require('string_decoder')
const decoder = new StringDecoder('utf8')
const config = require('./lib/config')
const handlers = require('./lib/handlers')
const helpers = require('./lib/helpers')
const server = {}

server.http = http.createServer((req, res) => {
    unifiedServer(req, res)
})

server.httpsOption = {
    'key': fs.readFileSync(path.join(__dirname, '/https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/https/cert.pem'))
}
server.https = https.createServer(server.httpsOption, (req, res) => {
    unifiedServer(req, res)
})

const unifiedServer = (req, res) => {

    const parsedUrl = url.parse(req.url, true)

    const path = parsedUrl.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g, '')

    const queryStringObject = parsedUrl.query

    const method = req.method.toLowerCase()

    const headers = req.headers

    let buffer = ''

    req.on('data', (data) => {
        buffer += decoder.write(data)
    })
    req.on('end', () => {
        buffer += decoder.end()

        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            'payload': helpers.parseJsonToObject(buffer)
        }
        const handler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : server.router.notFound
        handler(data, (statusCode, payload) => {
            const payloadString = JSON.stringify(payload)
            res.setHeader('Content-Type', 'application/json')
            res.writeHead(statusCode)
            res.end(payloadString)
        })
    })
}


server.init = () => {
    server.http.listen(config.httpPort, () => {
        console.log('http listening on ' + config.httpPort)
    })
    server.https.listen(config.httpsPort, () => {
        console.log('https listening on ' + config.httpsPort)
    })
}

server.router = {
    'users': handlers.users,
    'notFound': handlers.notFound,
    'tokens': handlers.tokens,
    'menu': handlers.menu,
    'shoppingCart': handlers.shoppingCart,
    'orders': handlers.orders
}


server.init()
module.exports = server