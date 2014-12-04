/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCCODER
 */


/*!
 * Module dependencies
 */
var winston = require('winston');


/*!
 * Represents logger service.
 * Using `winson` is wise as it supports multiple transports
 * and this service could log to some external storage if needed.
 * For now use just the console.
 */
var logger = new(winston.Logger)({
    transports: [
            new(winston.transports.Console)()
        // To add more transports see:
        // https://github.com/flatiron/winston#working-with-transports
        ]
});

module.exports = logger;
