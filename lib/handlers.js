const _data = require('./data')
const helpers = require('./helpers')
const handlers = {}

handlers.users = (data, callback) => {
    const acceptedMethod = ['post', 'get', 'put', 'delete']
    if (acceptedMethod.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback)
    } else {
        callback(400, { 'Error': data.method + ' http method not supported' })
    }
}

handlers._users = {}

//required field : firstName, lastName, email, streetAddress, password
handlers._users.post = (data, callback) => {
    const firstName = typeof (data.payload.firstName) == 'string' ? data.payload.firstName : false
    const lastName = typeof (data.payload.lastName) == 'string' ? data.payload.lastName : false
    const email = typeof (data.payload.email) == 'string' && /^([a-z\d\.-]+)@([a-z\d-]+)\.([a-z]{2,8})(\.[a-z]{2,8})?$/.test(data.payload.email) ? data.payload.email : false
    const streetAddress = typeof (data.payload.streetAddress) == 'string' ? data.payload.streetAddress : false
    const password = typeof (data.payload.password) == 'string' && data.payload.password.length >= 8 ? data.payload.password : false

    if (firstName && lastName && email && streetAddress && password) {
        _data.read('users', email, (err, data) => {
            if (err) {
                const user = {
                    firstName,
                    lastName,
                    email,
                    streetAddress,
                    password: helpers.hash(password)
                }
                _data.create('users', email, user, (err) => {
                    if (!err) {
                        callback(200)
                    } else {
                        callback(400, { 'Error': 'while creating user' })
                    }
                })
            } else {
                callback(400, { 'Error': 'user Already exist' })
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field or invalid format' })
    }
}

//required field : email
//todo validate token, remove password from response
handlers._users.get = (data, callback) => {
    const email = typeof (data.queryStringObject.email) == 'string' ? data.queryStringObject.email : false
    if (email) {
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false

        handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', email, (err, data) => {
                    if (!err && data) {
                        delete data.password
                        callback(200, data)
                    } else {
                        callback(404)
                    }
                })
            } else {
                callback(403, { "Error": "Missing required token in header, or token is invalid." })
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field' })
    }
}
//required field : email
//one of attributes must be provided
//todo validate token
handlers._users.put = (data, callback) => {
    const email = typeof (data.payload.email) == 'string' ? data.payload.email : false

    const firstName = typeof (data.payload.firstName) == 'string' ? data.payload.firstName : false
    const lastName = typeof (data.payload.lastName) == 'string' ? data.payload.lastName : false
    const streetAddress = typeof (data.payload.streetAddress) == 'string' ? data.payload.streetAddress : false
    const password = typeof (data.payload.password) == 'string' && data.payload.password.length > 8 ? data.payload.password : false

    if (email) {
        if (firstName || lastName || streetAddress || password) {
            const token = typeof (data.headers.token) == 'string' ? data.headers.token : false

            handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
                if (tokenIsValid) {
                    _data.read('users', email, (err, data) => {
                        if (!err && data) {
                            if (firstName) data.firstName = firstName
                            if (lastName) data.lastName = lastName
                            if (streetAddress) data.streetAddress = streetAddress
                            if (password) data.password = helpers.hash(password)
                            _data.update('users', email, data, (err) => {
                                if (!err) {
                                    callback(200)
                                } else {
                                    callback(500, { 'Error': 'WHILE updating' })
                                }
                            })
                        } else {
                            callback(404)
                        }
                    })
                } else {
                    callback(403, { "Error": "Missing required token in header, or token is invalid." })
                }
            })
        } else {
            callback(400, { 'Error': 'Nothing to update' })
        }
    } else {
        callback(400, { 'Error': 'Missing required field' })
    }
}

handlers._users.delete = (data, callback) => {
    const email = typeof (data.queryStringObject.email) == 'string' ? data.queryStringObject.email : false
    if (email) {
        const token = typeof (data.headers.token) == 'string' ? data.headers.token : false

        handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
            if (tokenIsValid) {
                _data.read('users', email, (err, data) => {
                    if (!err) {
                        _data.delete('users', email, (err) => {
                            if (!err) {
                                callback(200)
                            } else {
                                callback(500, { 'Error': 'While deleting' })
                            }
                        })
                    } else {
                        callback(404)
                    }
                })
            } else {
                callback(403, { "Error": "Missing required token in header, or token is invalid." })
            }
        })
    } else {
        callback(400, { 'Error': 'Missing required field' })
    }
}

handlers.notFound = (data, callback) => {
    callback(404)
}

handlers.tokens = (data, callback) => {
    const acceptedMethod = ['post', 'get', 'put', 'delete']
    if (acceptedMethod.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback)
    } else {
        callback(400, { 'Error': data.method + ' http method not supported' })
    }
}

handlers._tokens = {}
//required field: email, password
handlers._tokens.post = (data, callback) => {
    const email = typeof (data.payload.email) == 'string' ? data.payload.email : false
    const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length >= 8 ? data.payload.password : false

    if (email && password) {
        _data.read('users', email, (err, userData) => {
            if (!err && userData) {
                //check password
                const hashPass = helpers.hash(password)
                if (hashPass == userData.password) {
                    //generate token
                    const tokenId = helpers.createRandomString(20)
                    const expires = Date.now() + 1000 * 60 * 60
                    const tokenObject = {
                        'id': tokenId,
                        expires,
                        email
                    }
                    _data.create('tokens', tokenId, tokenObject, (err) => {
                        if (!err) {
                            callback(200, tokenObject)
                        } else {
                            callback(500, { 'Error': 'while creating token' })
                        }
                    })
                } else {
                    callback(400, { 'Error': 'invalid inputs' })
                }
            } else {
                callback(400, { 'Error': 'invalid inputs' })
            }
        })
    } else {
        callback(400, { 'Error': 'Missing req field' })
    }
}

handlers._tokens.get = (data, callback) => {
    const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData)
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, { 'Error': 'invalid params' })
    }
}

// to extend token for one hour
handlers._tokens.put = (data, callback) => {
    const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false
    if (id) {
        _data.read('tokens', id, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    tokenData.expires = Date.now() + 1000 * 60 * 60
                    _data.update('tokens', id, tokenData, (err) => {
                        if (!err) {
                            callback(200)
                        } else {
                            callback(500, { 'Error': 'Could not update the token\'s expiration.' })
                        }
                    })
                } else {
                    callback(400, { 'Error': 'token has been expired, cannot be extended' })
                }
            } else {
                callback(404)
            }
        })
    } else {
        callback(400, { 'Error': 'invalid params' })
    }
}

handlers._tokens.delete = (data, callback) => {
    const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false
    if (id) {
        _data.read('tokens', id, (err, data) => {
            if (!err && data) {
                _data.delete('tokens', id, (err) => {
                    if (!err) {
                        callback(200)
                    } else {
                        callback(500, { 'Error': 'could not delete' })
                    }
                })
            } else {
                callback(404, { 'Error': 'Not Found' })
            }
        })
    } else {
        callback(400, { 'Error': 'invalid params' })
    }
}

// Verify if a given token id is currently valid for a given user
handlers._tokens.verifyToken = (id, email, callback) => {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            // Check that the token is for the given user and has not expired
            if (tokenData.email == email && tokenData.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

handlers.menu = (data, callback) => {
    const acceptedMethod = ['get']
    if (acceptedMethod.indexOf(data.method) > -1) {
        handlers._menu[data.method](data, callback)
    } else {
        callback(400, { 'Error': data.method + ' http method not supported' })
    }
}

handlers._menu = {}
const menu = ['ranch', 'vegetables', 'grilled', 'pesto chicken', 'Pepperoni', 'Margarita']
handlers._menu.get = (data, callback) => {
    //check logged In
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
    _data.read('tokens', token, (err, tokenData) => {
        if (!err && tokenData) {
            if (tokenData.expires > Date.now()) {
                callback(200, { menu })
            } else {
                callback(400, { 'Error': 'You need to be logged in' })
            }
        } else {
            callback(500, { 'Error': 'Error reading token info' })
        }
    })
}

handlers.shoppingCart = (data, callback) => {
    const acceptedMethod = ['post', 'get', 'delete']
    if (acceptedMethod.indexOf(data.method) > -1) {
        handlers._shoppingCart[data.method](data, callback)
    } else {
        callback(400, { 'Error': data.method + ' http method not supported' })
    }
}
handlers._shoppingCart = {}

//req: token, menu items
handlers._shoppingCart.post = (data, callback) => {
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
    const items = typeof (data.payload.items) == 'object' && data.payload.items instanceof Array && data.payload.items.length > 0 ? data.payload.items : false

    if (token && items) {
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    _data.read('users', tokenData.email, (err, userData) => {
                        if (!err && userData) {
                            const shoppingCart = typeof (userData.shoppingCart) == 'object' && userData.shoppingCart instanceof Array && userData.shoppingCart.length > 0 ? userData.shoppingCart : []
                            items.forEach(item => {
                                if (shoppingCart.indexOf(item) < 0 && menu.indexOf(item) > -1) {
                                    //does not exist push it and in the item to push in the menu list
                                    shoppingCart.push(item)
                                }
                            })
                            userData.shoppingCart = shoppingCart
                            //update user data with posted info
                            _data.update('users', tokenData.email, userData, (err) => {
                                if (!err) {
                                    callback(200)
                                } else {
                                    callback(500, { 'Error': 'updating user info with shoppong cart' })
                                }
                            })
                        } else {
                            callback(500, { 'Error': 'No user found for the token, might be deleted' })
                        }
                    })
                } else {
                    callback(400, { 'Error': 'You need to be logged in' })
                }
            } else {
                callback(500, { 'Error': 'Error reading token info' })
            }
        })
    } else {
        callback(400, { 'Error': 'invalid params' })
    }
}

handlers._shoppingCart.get = (data, callback) => {
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
    if (token) {
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    _data.read('users', tokenData.email, (err, userData) => {
                        if (!err && userData) {
                            callback(200, { 'shoppingCart': userData.shoppingCart })
                        } else {
                            callback(500, { 'Error': 'User not found' })
                        }
                    })
                } else {
                    callback(400, { 'Error': 'Token expired' })
                }
            } else {
                callback(400, { 'Error': 'Error reading token info, check out' })
            }
        })
    } else {
        callback(400, { 'Error': 'invalid params' })
    }
}

handlers._shoppingCart.delete = (data, callback) => {
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
    const itemsToBeDeleted = typeof (data.payload.items) == 'object' && data.payload.items instanceof Array && data.payload.items.length > 0 ? data.payload.items : false

    if (token && itemsToBeDeleted) {
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    _data.read('users', tokenData.email, (err, userData) => {
                        if (!err && userData) {
                            const shoppingCart = typeof (userData.shoppingCart) == 'object' && userData.shoppingCart instanceof Array && userData.shoppingCart.length > 0 ? userData.shoppingCart : []
                            itemsToBeDeleted.forEach(item => {
                                if (shoppingCart.indexOf(item) > -1) {
                                    //item exist remove it
                                    shoppingCart.splice(shoppingCart.indexOf(item), 1)
                                }
                            })
                            userData.shoppingCart = shoppingCart
                            //update user data with posted info
                            _data.update('users', tokenData.email, userData, (err) => {
                                if (!err) {
                                    callback(200)
                                } else {
                                    callback(500, { 'Error': 'updating user info with shoppong cart' })
                                }
                            })
                        } else {
                            callback(500, { 'Error': 'No user found for the token, might be deleted' })
                        }
                    })
                } else {
                    callback(400, { 'Error': 'You need to be logged in' })
                }
            } else {
                callback(500, { 'Error': 'Error reading token info' })
            }
        })
    } else {
        callback(400, { 'Error': 'invalid params' })
    }
}

handlers.orders = (data, callback) => {
    const acceptedMethod = ['post', 'get']
    if (acceptedMethod.indexOf(data.method) > -1) {
        handlers._orders[data.method](data, callback)
    } else {
        callback(400, { 'Error': data.method + ' http method not supported' })
    }
}
handlers._orders = {}

//make charge for what in the cart
handlers._orders.post = (data, callback) => {
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
    if (token) {
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    _data.read('users', tokenData.email, (err, userData) => {
                        if (!err && userData) {
                            const items = userData.shoppingCart
                            const price = items.length * 5
                            helpers.chargeCard(price, (err, orderId) => {
                                if (!err) {
                                    //save to db and mail
                                    const orderObject = {
                                        'items': items,
                                        'email': userData.email,
                                        'price': price,
                                        'id': orderId,
                                        'created_at': Date.now()
                                    }
                                    _data.create('orders', orderId, orderObject, (err) => {
                                        if (!err) {
                                            // callback(200)
                                            //mail to payer save to user array order
                                            userData.orders = typeof (userData.orders) == 'object' && userData.orders instanceof Array ? userData.orders : []
                                            userData.orders.push(orderId)
                                            _data.update('users', userData.email, userData, (err) => {
                                                if (!err) {
                                                    //mail user
                                                    const to = {
                                                        firstName: userData.firstName,
                                                        lastName: userData.lastName,
                                                        email: userData.email
                                                    }
                                                    const subject = 'Order placed'
                                                    let itemsString = ''
                                                    orderObject.items.forEach(item => itemsString += `          -${item}\n`)

                                                    const text = 'Your payment proceeded with this order details:\n' +
                                                        `   price: ${orderObject.price}\n` +
                                                        `   items:\n` +
                                                        `${itemsString}`
                                                    helpers.sendEmail(to, subject, text, (err, mailId) => {
                                                        if (!err && mailId) {
                                                            callback(200)
                                                        } else {
                                                            callback(500, { 'Error': 'error while sending mail' })
                                                        }
                                                    })
                                                } else {
                                                    callback(500, { 'Error': "updating user's orders array" })
                                                }
                                            })
                                        } else {
                                            callback(500, { 'Error': 'error saving order in db' })
                                        }
                                    })
                                } else {
                                    callback(500, { 'Error': 'Something went wrong in Purchase' })
                                }
                            })
                        } else {
                            callback(400, { 'Error': 'User not found' })
                        }
                    })
                } else {
                    callback(400, { 'Error': 'expired token, you need to be logged in' })
                }
            } else {
                callback(400, { 'Error': 'Token not found' })
            }

        })
    } else {
        callback(400, { 'Error': 'missing token' })
    }
}
handlers._orders.get = (data, callback) => {
    const id = typeof (data.queryStringObject.id) == 'string' ? data.queryStringObject.id.trim() : false
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false
    if (token) {
        _data.read('tokens', token, (err, tokenData) => {
            if (!err && tokenData) {
                if (tokenData.expires > Date.now()) {
                    _data.read('users', tokenData.email, (err, userData) => {
                        if (!err && userData) {
                            //if no id return all ids
                            if(id){
                                _data.read('orders', id, (err, data)=>{
                                    if(!err && data){
                                        callback(200, {order: data})
                                    } else {
                                        callback(404, {'Error': 'double check the id'})
                                    }
                                })
                            } else {
                                //return ids in orders array in the user object
                                callback(200, {orders: userData.orders})
                            }
                        } else {
                            callback(400, { 'Error': 'User not found' })
                        }
                    })
                } else {
                    callback(400, { 'Error': 'expired token, you need to be logged in' })
                }
            } else {
                callback(400, { 'Error': 'Token not found' })
            }
        })
    } else {
        callback(400, { 'Error': 'missing token' })
    }
}
module.exports = handlers