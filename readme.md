

key generation:
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem

This a Node.js app without any external packages, integrated with stripe and mailgun to charge and send email for customer when they place a pizza order.

###ENDPOINT

##users
    CREATE A USER
    POST /users
       payload: firstName, lastName, email, streetAddress, password
    
    RETRIEVE A USER
    GET /users?email=?email=example@xompneu.com
       token required in headers

    UPDATE A USER
    PUT /users
       payload: firstName, lastName, email(REQUIRED), streetAddress, password
       token required in headers

    DELETE A USER
    DELETE /users?email=example@xompneu.com
       token required in headers

##tokens
    FOR LOGIN AND LOGOUT

    CREATE A TOKEN
    POST /tokens
       payload: firstName, password
    
    RETRIEVE A TOKEN
    GET /tokens?id=bhksqshjbaab12ejhb

    UPDATE A TOKEN (extend)
    PUT /tokens
       payload: id
    
    DELETE A TOKEN
    DELETE /users?id=bhksqshjbaab12ejhb

##menu
  RETRIEVE MENU LIST
    GET /menu
         token required in headers

##shoppingcart
    ADD TO CART
    POST /shoppingCart
        payload:  "items":["vegetables"]
        token required in headers

    
    RETRIEVE A CART
    GET /shoppingCart
        token required in headers
    
    DELETE A CART
    DELETE /shoppingCart
        payload:  "items":["vegetables"]
        token required in headers

##orders
    To place order
    POST /orders
        token required in headers

    
    RETRIEVE A all orders placed by the user
    GET /orders
        token required in headers
    
    RETRIEVE A all orders placed by the user
    GET /orders?id=ch_1Da1Q9JIOtkQnihmt73DM1xy
        token required in headers