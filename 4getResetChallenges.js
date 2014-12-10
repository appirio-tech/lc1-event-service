var kue = require('kue');
var _ = require('lodash');
var q = kue.createQueue({
  prefix: 'q',
  redis: {
    port: 6379,
    host: '127.0.0.1',
    //  auth: 'password',
    //db: 3, // if provided select a non-default redis db
    options: {
      // see https://github.com/mranney/node_redis#rediscreateclientport-host-options
    }
  }
});
var http = require('http');
// createthe job queue
var jobs = kue.createQueue();
var mydatetime = new Date().toISOString();

// var getChallengesReadyforReview = function() {
//
//
// }

// setInterval(
//   function() {

    console.log(" the time is " + mydatetime);
    var apiCall = 'http://dev-lc1-challenge-service.herokuapp.com/challenges?filter=id=in(42,43,45)';
    apiCall += '%26subEndAt<';
    apiCall += mydatetime;
    console.log(' the api call is ' + apiCall);


    http.get ( apiCall, function(res) {
      //console.log('got a response ', res.statusCode);
      var body = '';

      res.on('data', function(d) {
        //console.log('BODY: ' + d);
        body += d;
        //console.log('title is ' + chunk.title)
      });

      res.on('end', function() {
        var parsed = JSON.parse(body);
        //console.log(' the content is ' + parsed.content);
        //console.log(' the length content is ' + parsed.content.length);
        _(parsed.content).forEach(function(chal) {
          var job = jobs.create('reset_test_challenges', {
              title: chal.title,
              status: chal.status,
              subEndAt: chal.subEndAt,
              id: chal.id
            },
            // this works if you need to load the whole challenge
            /*
            var job = jobs.create('filp_to_review', chal,
            */
            console.log(' job id:' + chal.id + ' ' + chal.title + ' ' + chal.subEndAt + ' add to filp_to_review Queue')).save();

          job.on('complete', function() {
            console.log('job  complete ');
          });

          job.on('failed', function() {
            console.log('job failed ');
          });
        }); // forEach
      }); // res.on

    } // get and call back
  );
 // }, 10000); // function, setInterval
