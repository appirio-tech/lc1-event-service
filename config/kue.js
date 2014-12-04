/*
 * Copyright (C) 2014 TopCoder Inc., All Rights Reserved.
 *
 * @version 1.0
 * @author TCCODER
 */


/*!
 * Module dependencies
 */
var url = require('url'),
    redis = require('redis'),
    _ = require('lodash'),
    default_redis_options = {
        // Put desired redis client options here if you need/want to use some.
        // See: [overloading](https://github.com/mranney/node_redis#overloading) for details.
    };


/**
 * Represents "special" kue's configuration object.
 * It is capable to work with Heroku or in local evironment.
 * Automatically detects environment and handles accordingly.
 */
module.exports = {
    prefix: process.env.KUE_PREFIX || 'q',
    redis: {
        /*
         * Because in Heroku the redis addons provide URL instead of port, host etc
         * this module needs to parse the URL because `node_redis` can not work with URLs. Thus `kue` also can not.
         * See: https://github.com/LearnBoost/kue/issues/363
         */
        createClientFactory: function () {
            /*
             * In Heroku the redis addons define environment variables.
             * We use this fact to decide how to create the client kue will use.
             */

            // Redis To Go
            // https://devcenter.heroku.com/articles/redistogo#using-with-node-js
            if (process.env.REDISTOGO_URL)
                return prepareClient(process.env.REDISTOGO_URL);

            // Redis Cloud
            // https://devcenter.heroku.com/articles/rediscloud#using-redis-from-node-js
            else if (process.env.REDISCLOUD_URL)
                return prepareClient(process.env.REDISCLOUD_URL, {
                    no_ready_check: true
                });

            // Openredis
            // https://devcenter.heroku.com/articles/openredis#using-redis-from-node-js
            else if (process.env.OPENREDIS_URL)
                return prepareClient(process.env.OPENREDIS_URL);

            // RedisGreen
            // https://devcenter.heroku.com/articles/redisgreen#using-redis-with-node-js
            else if (process.env.REDISGREEN_URL)
                return prepareClient(process.env.REDISGREEN_URL);

            // For local environment.
            else
                return redis.createClient(process.env.REDIS_PORT || 6379, process.env.REDIS_HOST || '127.0.0.1', default_redis_options);
        }
    }
};

/**
 * Parses redis URL and returns redis client.
 *
 * @param   {String} URL  The URL to parse
 * @param   {Object} options  Some options to merge to default redis options.
 * @returns {Object}  Redis client
 * @api private
 */
function prepareClient(URL, options) {
    var options = _.defaults(default_redis_options, options),
        PARSED_URL = url.parse(URL),
        CLIENT = redis.createClient(PARSED_URL.port, PARSED_URL.hostname, options);

    if (PARSED_URL.auth)
        CLIENT.auth(PARSED_URL.auth.split(':')[1]);

    return CLIENT;
};
