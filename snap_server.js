var fs = require('fs');
var cp = require('child_process');

var async = require('async');
var AWS = require('aws-sdk');
var envvar = require('envvar');
var R = require('ramda');
var redis = require('redis');

var AWS_ACCESS_KEY_ID = envvar.string('AWS_ACCESS_KEY_ID');
var AWS_SECRET_ACCESS_KEY = envvar.string('AWS_SECRET_ACCESS_KEY');
AWS.config.update({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
  sslEnabled: false
});
var s3 = new AWS.S3();


var REDIS_PORT = envvar.number('REDIS_PORT', 6379);
var REDIS_HOST = envvar.string('REDIS_HOST', 'localhost');
var subscriber = redis.createClient(REDIS_PORT, REDIS_HOST);
var publisher = redis.createClient(REDIS_PORT, REDIS_HOST);

subscriber.subscribe('autosnap_requests');

subscriber.on('message', function(channel, identifier) {
  if (channel === 'autosnap_requests') {
    async.waterfall([R.lPartial(captureSnap, identifier), uploadSnap], function(err, snap) {
      publisher.publish(identifier, snap.url);
    });
  }
  // Received a message on an unknown channel...
});

var captureSnap = function(identifier, cbk) {
  var filename = identifier + '.jpg';
  console.log('filename: '+ filename);
  // var filename = uuid.v4() + '.jpg';
  var snapShot = cp.spawn('imagesnap', ['-w', 3.0, filename]);

  snapShot.on('close', function() {
    fs.readFile('./'+ filename, function(err, data) {
      if(!err) {
        return cbk(null, {filename: filename, data: data});
      } else {
        return cbk(err);
      }
    });
  });
}

var uploadSnap = function(snap, cbk) {
  var params = {
    Bucket: 'autoSnap',
    Body: snap.data,
    Key: snap.filename
  };

  // Upload to S3
  s3.putObject(params, function(err) {
    if(err == null) {
      var url = s3.getSignedUrl('getObject', {
        Bucket: 'autoSnap',
        Key: snap.filename,
        Expires: 3600
      });
      cbk(null, {url: url});
      // Delete local copy
      fs.unlinkSync('./'+ snap.filename);
    } else {
      cbk(err);
    }
  });
}
