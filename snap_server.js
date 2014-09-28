var redis = require('redis');
var async = require('async');
var uuid  = require('node-uuid');
var fs    = require('fs');
var spawn = require('child_process').spawn
var R = require('ramda');
var AWS = require('aws-sdk');

AWS.config.loadFromPath('./config/aws.json');
var s3 = new AWS.S3();
var awsDefaults = { Bucket : 'autoSnap' };

var redis_config = JSON.parse(fs.readFileSync('./config/redis.json'));
var client = redis.createClient(redis_config.port, redis_config.host, {no_ready_check:true});
client.auth(redis_config.password);

client.subscribe("autoSnap-requests");

var responder = redis.createClient(redis_config.port, redis_config.host, {no_ready_check:true});
responder.auth(redis_config.password);

client.on("message", function(channel, identifier) {
  if(channel === "autoSnap-requests") {
    async.waterfall([captureSnap, uploadSnap], function(err, snap) {
      responder.publish(identifier, snap.url);
    });
  }
});


var captureSnap = function(cbk) {
  var filename = uuid.v4() + '.jpg';
  var snapShot = spawn('imagesnap', [filename]);

  snapShot.on('close', function() {
    fs.readFile('./'+ filename, function(err, data) {
      if(!err) {
        return cbk(null, { filename: filename, data: data });
      } else return cbk(err);
    });
  });
}

var uploadSnap = function(snap, cbk) {
  var params = R.mixin(awsDefaults, { Body : snap.data , Key : snap.filename });

  // Upload to S3
  s3.putObject(params, function(err, d) {
    if(!err) {
      var url = s3.getSignedUrl('getObject', R.mixin(awsDefaults, { Key: snap.filename, Expires: 3600}));
      cbk(null, { url: url });
      // Delete local copy
      fs.unlinkSync('./'+ snap.filename);
    } else {
      cbk(err);
    }
  });
}
