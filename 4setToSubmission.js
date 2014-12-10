var kue = require('kue');
var http = require('http');
var q = kue.createQueue({
  prefix: 'q',
  redis: {
    port: 6379,
    host: '127.0.0.1',
    //  auth: 'password',
  //  db: 3, // if provided select a non-default redis db
    options: {
      // see https://github.com/mranney/node_redis#rediscreateclientport-host-options
    }
  }
});


// createthe job queue
var jobs = kue.createQueue();

jobs.process('reset_test_challenges', function(job, done) {
  console.log(job.data);
  setTimeout(function() {
    console.log('job challenge id: ' + job.data.id + ' processed');

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
    console.log('the body length is '+ bodyString.length);
    var options = {
      host: 'dev-lc1-challenge-service.herokuapp.com',
      port: 80,
      path: '/challenges/' + job.data.id,
      method: 'PUT',
      headers: headers
    };

   console.log('DEBUG host + path '+ options.host + options.path);

    var req = http.request(options, function(res) {
      res.setEncoding('utf8');

      var responseString = '';

      res.on('data', function(chunk) {
        responseString += chunk;
        //console.log('Reponse: ' + chunk);
      });

      res.on('end', function() {
        var resultObject = JSON.parse(responseString);
        console.log('the response is ' + responseString);
      });

      req.on('error', function(e) {
        console.log('the error is ' + e);
      });

    });
    req.write(bodyString);
    req.end();



    done();

  }, 3000);
});
