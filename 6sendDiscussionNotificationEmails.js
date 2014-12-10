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
  log = require('./utils/logger'),
  q = kue.createQueue(require('./config/kue')),
  _ = require('lodash'),
  dotenv = require('dotenv').load(),
  sendgrid = require('sendgrid')(process.env.SENDGRID_USER, process.env.SENDGRID_API_KEY),
  toEmailHtml = require('jade').compileFile('./templates/email.jade'),
  SEND_DISC_NOTE_QUEUE_NAME = process.env.SEND_DISC_NOTE_QUEUE_NAME,
  module_name = 'Emailer',
  jobsFilter = require('./utils/jobsFilter');


log.info('%s: Init %s consumer...', module_name, SEND_DISC_NOTE_QUEUE_NAME);

// Define the job consumer processing the queue.
q.process(
  SEND_DISC_NOTE_QUEUE_NAME,
  function (job, done) {

    log.info('%s: Processing job with id: %d', module_name, job.id, job.data);

    // Check for already sent notifications.
    jobsFilter(
      SEND_DISC_NOTE_QUEUE_NAME,
      'complete', {
        challengeId: job.data.challengeId,
        userHandle: job.data.userHandle,
        messageId: job.data.messageId
      }, function (err, res) {
        if (err) {
          done(err);
        }

        if (!res.length) {
          // Participant needs to be notified.
          // Let's try do it now.
          var email = new sendgrid.Email({
            // This will need to change when the API is capable to provision user emails.
            // For now just send to some test email.
            to: process.env.RECIPIENT_TEST_EMAIL,
            from: process.env.FROM_EMAIL,
            subject: '[' + job.data.userHandle + '] New discussion message for challenge "' + job.data.title + '"',
            html: toEmailHtml(job.data)
          });
          sendgrid.send(email, function (err, json) {
            if (err) {
              // Some error sending the email. Mark this job for repeating.
              done(err);
            } else {
              // Email sent. Job complete.
              done(null, json);
            }
          });
        } else {
          done(new Error('Participant ' + job.data.userHandle + ' already notified via email'));
        }
      });
  }
);

// Handle job enqueued event.
q.on('job enqueue', function (id) {
  // Job enqueued notification.
  log.info('%s: job enqueued with id: %d ', module_name, id);
}).on('job failed attempt', function (id, error) {
  // Retry of failed jobs is controlled by attempts value
  // so here just notify.
  log.error('%s: job id: %d attempt failed', module_name, id, error);
}).on('job failed', function (id, error) {
  // Job failed notification.
  log.error('%s: job id: %d failed', module_name, id, error);
}).on('job complete', function (id, result) {
  // Job completed notification.
  log.info('%s: job id: %d completed', module_name, id, result);
});
