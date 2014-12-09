/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCCODER
 */


/*!
 * Module dependencies
 */
var kue = require('kue'),
    q = kue.createQueue(require('./config/kue')),
    basicAuth = require('basic-auth'),
    express = require('express'),
    log = require('./utils/logger');


// Create express app to serve admin UI.
var app = express();
app.set('title', 'LC event service');

// Use basic authorization in production to protect the kue.
if (process.env.NODE_ENV == 'production')
    app.use(function (req, res, next) {
        function unauthorized(res) {
            res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
            return res.send(401);
        };

        var user = basicAuth(req);

        if (!user || !user.name || !user.pass) {
            return unauthorized(res);
        };

        if (user.name === (process.env.AUTH_USER || 'foo') && user.pass === (process.env.AUTH_PASS || 'bar')) {
            return next();
        } else {
            return unauthorized(res);
        };
    });

// Add kue's functionallity.
app.use(kue.app)

// Start the server.
app.listen(parseInt(process.env.PORT) || 3333);
log.info('Kue\'s admin UI started on port', parseInt(process.env.PORT) || 3333);
