

var kue = require('kue'),
jobs = kue.createQueue(require('./config/kue')),
http = require('http'),
log = require('./utils/logger'),


jobs.process('reset_test_challenges', function(job, done) {
  console.log(job.data);
  setTimeout(function() {
    log.info('job challenge id: ' + job.data.id + ' processed');

    var body = {
      status: 'SUBMISSION',
      title: job.data.title,
      projectSource:  "TOPCODER"
    };
    var bodyString = JSON.stringify(body);
    var headers = {
      'Content-Type': 'application/json',
      'Content-Length': bodyString.length
    };
    log.info('the body length is '+ bodyString.length);
    var options = {
      host: 'dev-lc1-challenge-service.herokuapp.com',
      port: 80,
      path: '/challenges/' + job.data.id,
      method: 'PUT',
      headers: headers
    };

   log.info('DEBUG host + path '+ options.host + options.path);

    var req = http.request(options, function(res) {
      res.setEncoding('utf8');

      var responseString = '';

      res.on('data', function(chunk) {
        responseString += chunk;
        //log.info('Reponse: ' + chunk);
      });

      res.on('end', function() {
        var resultObject = JSON.parse(responseString);
        log.info('the response is ' + responseString);
      });

      req.on('error', function(e) {
        log.info('the error is ' + e);
      });

    });
    req.write(bodyString);
    req.end();



    done();

  }, 3000);
});
