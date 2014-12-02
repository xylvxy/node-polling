//
/////////////////////////////////
var HttpConn = require('./httpConn').create();
HttpConn.start(3000, '127.0.0.1');
HttpConn.on('conn', function(uid, queryObj, data){
    console.log('event_conn:', JSON.stringify(arguments));
})
