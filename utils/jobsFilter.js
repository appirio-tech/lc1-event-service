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
  q = kue.createQueue(require('../config/kue')),
  _ = require('lodash');

/**
 * Filters queue for jobs in a given state that deeply equal condition object.
 *
 * @param {String} type The queue name
 * @param {String} state Wish state of job.
 * @param {Object} condition Job to have equal key/value.
 * @param {Function} callback Function to invoke when ready with error|result.
 */
module.exports = function (type, state, condition, callback) {
  q.cardByType(type, state, function (err, len) {
    if (err) {
      callback(err);
    }

    if (len) {
      kue.Job.rangeByType(type, state, 0, len, 'desc', function (err, jobs) {
        if (err) {
          callback(err);
        }

        if (jobs) {
          callback(
            null,
            _.chain(jobs)
            .pluck('data')
            .where(condition)
            .value()
          );
        }
      });
    } else {
      callback(null, []);
    }
  });
};
