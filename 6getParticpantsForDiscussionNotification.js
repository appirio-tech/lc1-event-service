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
  //dotenv = require('dotenv').load(),
  DISC_MESSAGE_QUEUE_NAME = process.env.DISC_MESSAGE_QUEUE_NAME,
  SEND_DISC_NOTE_QUEUE_NAME = process.env.SEND_DISC_NOTE_QUEUE_NAME,
  SEND_DISC_NOTE_QUEUE_PRIORITY = process.env.SEND_DISC_NOTE_QUEUE_PRIORITY,
  SEND_DISC_NOTE_QUEUE_ATTEMPTS = process.env.SEND_DISC_NOTE_QUEUE_ATTEMPTS,
  getChallengeParticipants = require('./utils/getChallengeParticipants'),
  module_name = 'Discussion consumer/email producer',
  jobsFilter = require('./utils/jobsFilter');


log.info('%s: Init %s consumer/producer...', module_name, DISC_MESSAGE_QUEUE_NAME);

// Define the job consumer processing the queue.
q.process(
  DISC_MESSAGE_QUEUE_NAME,
  function (job, done) {

    log.info('%s: Processing job with id: %d', module_name, job.id, job.data);

    // Check for already enqueued discussion messages.
    jobsFilter(
      DISC_MESSAGE_QUEUE_NAME,
      'complete', {
        challengeId: job.data.challengeId,
        messageId: job.data.messageId
      }, function (err, res) {
        if (err) {
          done(err);
        }

        if (!res.length) {
          getChallengeParticipants(job, function (err, rsp) {
            if (err) {
              // Let retries be controlled via queue's job attemps.
              // Just mark this attempt as failed. It will be retried on next
              // event loop.
              done(err);
            } else {
              // Filter out msg creator
              var participants = _.reject(rsp.content.participants, {
                userId: job.data.createdBy
              });
              log.info('DEBUG: participants are ' + participants);
              // Iterate the data and add users to emailing queue
              if (participants.length) {
                var processed = _.after(participants.length, function () {
                  // Invoked when all done.
                  done(null, 'All related participants enqueued to emailing');
                });
                _.forEach(participants, function (participant) {
                  log.info('%s: Saving %s(id: %d) to email queue', module_name, participant.userHandle, participant.userId);
                  // Create the job.
                  var email_job = q.create(
                      SEND_DISC_NOTE_QUEUE_NAME, {
                        title: rsp.content.title,
                        content: job.data.content,
                        challengeId: participant.challengeId,
                        authorId: job.data.createdBy,
                        createdAt: new Date(job.data.createdAt).toUTCString(),
                        userHandle: participant.userHandle,
                        userId: participant.userId,
                        messageId: job.data.messageId
                      })
                    .priority(SEND_DISC_NOTE_QUEUE_PRIORITY)
                    .attempts(SEND_DISC_NOTE_QUEUE_ATTEMPTS)
                    .save(function (save_err) {
                      if (save_err) {
                        log.error(
                          '%s: Saving %s(id: %d) for emailing failed',
                          module_name, participant.userHandle, participant.userId, save_err
                        );
                        // Complicated here!
                        // Not good idea to mark the whole parent job as errored
                        // as all already enqueued for emailing and the rest could be saved so better just skip this error
                        // and call processed
                        processed();
                      } else {
                        log.info(
                          '%s: Saved %s(id: %d) to queue for emailing. Job id:',
                          module_name, participant.userHandle, participant.userId, email_job.id
                        );
                        processed();
                      }
                    });
                });
              } else {
                done(null, 'No participants to email');
              }
            }
          });
        } else {
          done(new Error('Discussion message with Id:' + job.data.messageId + ' already enqueued for emailing'));
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
