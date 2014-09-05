// Dependencies (there are quite a few sadly...)
var spawn = require('child_process').spawn
  , AWS   = require('aws-sdk')
  , uuid  = require('node-uuid')
  , fs    = require('fs')
  , app   = require('express')()
  , http  = require('http').Server(app)
  , io    = require('socket.io')(http)
  , R     = require('ramda');


 // Local image folder, used as a cache
 var snapFolder = './cache';

// Load & configure S3
AWS.config.loadFromPath('./aws_config.json');
var s3 = new AWS.S3();
var awsDefaults = { Bucket : 'autoSnap' };

// Serve the interface
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Image capture handler
// NOTE: This implementation uses imagesnap, an open source utility designed to work with iSight cameras
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

// Socket interface
io.on('connection', function(socket){
	socket.on('takeSnap', function() {
		captureSnap(function(err, result) {
	  		if(!err) {
	  			var params = R.mixin(awsDefaults, { Body : result.data , Key : result.filename });
	  			
	  			// Upload to S3
	  			s3.putObject(params, function(err, d) {
	  				if(!err) {			  				
						var url = s3.getSignedUrl('getObject', R.mixin(awsDefaults, { Key: result.filename, Expires: 3600}));
						// Send back our url to the browser
		  				socket.emit('snapSuccess', { url : url });

		  				// Delete local copy
		  				fs.unlinkSync('./'+ result.filename);
	  				} else {
	  					/// TODO: handle error properly
	  					socket.emit('snapFailed', { error: err });
	  				}
	  			});
	  		} else {
	  			// TODO: handle error properly
	  			socket.emit('snapFailed', { error: err });
	  		}
		});
	});
});

// Server
http.listen(3000, function(){
	console.log('autoSnap server listening on port 3000');
});