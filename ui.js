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




// start the admin client
kue.app.listen(3000);
kue.app.set('title', 'LC event service');



// 127.0.0.1:6379
