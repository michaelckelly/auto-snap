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

// Load & configure S3 & message queue
AWS.config.loadFromPath('./aws_config.json');
var s3 = new AWS.S3()
  , sqs = new AWS.SQS();

var awsDefaults = {
	S3: {
		Bucket : 'autoSnap'
	},
	SQS: { 
		QueueName : 'autoSnap'
	}
};

// On startup grab the queue url
sqs.getQueueUrl(awsDefaults.SQS, function(err, data) {
	if(err) throw new Error(err);
	awsDefaults.SQS.QueueUrl = data.QueueUrl;
});

var checkQueue = function() {

	var params = {
		QueueUrl : awsDefaults.SQS.QueueUrl,
		MaxNumberOfMessages : 1,
		MessageAttributeNames: [
			'snapRequest'
		]
	};

	sqs.receiveMessage(params, function(err, data) {
		console.log(err||data);
	});

}

var postQueue = function() {
	var params = {
		QueueUrl : awsDefaults.SQS.QueueUrl,
		MessageBody : 'autoSnap',
		MessageAttributes : {
			messageType : {
				DataType : 'String',
				StringValue : 'snapRequest'
			}
		}
	}

	sqs.sendMessage(params, function(err, data) {
		console.log(err||data);
	});
}

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
		console.log('attempting to post to queue');
		postQueue();
		/*captureSnap(function(err, result) {
	  		if(!err) {
	  			var params = R.mixin(awsDefaults.S3, { Body : result.data , Key : result.filename });
	  			
	  			// Upload to S3
	  			s3.putObject(params, function(err, d) {
	  				if(!err) {			  				
						var url = s3.getSignedUrl('getObject', R.mixin(awsDefaults.S3, { Key: result.filename, Expires: 3600}));
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
		});*/
	});
});

// Server
http.listen(3000, function(){
	console.log('autoSnap server listening on port 3000');
});