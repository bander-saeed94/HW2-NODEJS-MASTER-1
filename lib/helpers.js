const crypto = require('crypto')
const config = require('./config')
const querystring = require('querystring')
const https = require('https')
const StringDecoder = require('string_decoder').StringDecoder
const decoder = new StringDecoder('utf8')
const helpers = {}

helpers.parseJsonToObject = (str) => {
    try {
        return JSON.parse(str)
    } catch (e) {
        return {}
    }
}
helpers.hash = (str) => {
    if (typeof (str) == 'string' && str.length > 0)
        return crypto.createHmac('sha256', config.hashSecret).update(str).digest('hex')
    else
        return false
}

helpers.createRandomString = (length) => {
    length = typeof (length) == 'number' && length > 0 ? length : false
    if (length) {
        const possibleChar = 'abcdefghijklmnopqrstuvwyz1234567890'
        let str = ''
        for (i = 0; i < length; i++) {
            const randomChar = possibleChar.charAt(Math.floor(Math.random() * possibleChar.length))
            str += randomChar
        }
        return str
    } else {
        return false
    }
}
//https://stripe.com/docs/api/charges/create
helpers.chargeCard = (price, callback) => {
    const amount = price * 100;
    const payload = {
        amount: amount,
        currency: 'usd',
        source: 'tok_visa_debit',
        description: "Charge for me from node.js"
    }

    const stringPayload = querystring.stringify(payload)

    const requestDetails = {
        'protocol': 'https:',
        'hostname': 'api.stripe.com',
        'method': 'POST',
        'path': '/v1/charges',
        'auth': config.stripSecretKey + ':',
        'headers': {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(stringPayload)
        }
    }
    // Instantiate the request object
    const req = https.request(requestDetails, (res) => {
        const status = res.statusCode
        let str = ''
        res.on('data', (data) => {
            str += decoder.write(data)
        })
        res.on('end', () => {
            str += decoder.end()
            const resJson = JSON.parse(str)
            if (resJson.status == 'succeeded' || status == 200 || status == 201) {
                callback(false, resJson.id)
            } else {
                callback('Status code returned was ' + status)
            }
        })
    })
    req.on('error', function (e) {
        callback(e)
    })
    // Add the payload
    req.write(stringPayload)
    req.end()
}

helpers.sendEmail = (to, subject, text, callback) => {
    to.firstName = typeof (to.firstName) == 'string' ? to.firstName : false
    to.lastName = typeof (to.lastName) == 'string' ? to.lastName : false
    to.email = typeof (to.email) == 'string' && /^([a-z\d\.-]+)@([a-z\d-]+)\.([a-z]{2,8})(\.[a-z]{2,8})?$/.test(to.email) ? to.email : false
    subject = typeof (subject) == 'string' ? subject : false;
    text = typeof (text) == 'string' ? text : false;
    if (to.firstName &&
        to.lastName &&
        to.email &&
        subject &&
        text) {
        const payload = {
            from: `Mailgun Sandbox <postmaster@${config.mailgunDomainName}>`,
            to: `${to.firstName} ${to.lastName} <${to.email}>`,
            subject: subject,
            text: text
        }
        const stringPayload = querystring.stringify(payload)
        const requestDetails = {
            'protocol': 'https:',
            'hostname': 'api.mailgun.net',
            'method': 'POST',
            'path': '/v3/' + config.mailgunDomainName + '/messages',
            'auth': 'api:' + config.mailgunApiKey,
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(stringPayload)
            }
        }
        const req = https.request(requestDetails, (res) => {
            const status = res.statusCode
            let str = ''
            res.on('data', (data) => {
                str += decoder.write(data)
            })
            res.on('end', () => {
                str += decoder.end()
                const resJson = JSON.parse(str)
                if (status == 200 || status == 201) {
                    callback(false, resJson.id)
                } else {
                    callback('Status code returned was ' + status)
                }
            })
        })
        req.on('error', function (e) {
            callback(e)
        })
        // Add the payload
        req.write(stringPayload)
        req.end()
    } else {
        callback('One of the param missing or invalid')
    }
}
module.exports = helpers