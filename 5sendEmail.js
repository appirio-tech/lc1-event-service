
var dotenv = require('dotenv');
dotenv.load();

var kue = require('kue');
var q = kue.createQueue({
  prefix: 'q',
  redis: {
    port: 6379,
    host: '127.0.0.1',
    //  auth: 'password',
    db: 3, // if provided select a non-default redis db
    options: {
      // see https://github.com/mranney/node_redis#rediscreateclientport-host-options
    }
  }
});
var sendgrid_username   = process.env.SENDGRID_USERNAME;
var sendgrid_password   = process.env.SENDGRID_PASSWORD;
var to = 'kbowerma+sendgrid@appirio.com';

var sendgrid   = require('sendgrid')(sendgrid_username,  sendgrid_password);



// createthe job queue
var jobs = kue.createQueue();

jobs.process('test_email', function(job, done) {
  console.log(job.data);
  setTimeout(function() {
    console.log('job challenge id: ' + job.data.id + ' processed');

    var email      = new sendgrid.Email();

    email.addTo(to);
    email.setFrom(to);
    email.setSubject('[Sendgrid testing - ktb] ' + job.data.title + ' New Discussion');
    //email.setText('title: ' + job.data.title);
    email.setHtml('<b>Title:</b> ' + job.data.title + '<br><b> Description: </b>' + job.data.description );
    email.addHeader('X-Sent-Using', 'SendGrid-API');
    email.addHeader('X-Transport', 'web');


    sendgrid.send(email, function(err, json) {
      if (err) { return console.error(err); }
        console.log(json);
      });



    done();

  }, 3000);
});
