// Dependencies (there are quite a few sadly...)
var spawn = require('child_process').spawn
  , AWS   = require('aws-sdk')
  , uuid  = require('node-uuid')
  , fs    = require('fs')
  , app   = require('express')()
  , http  = require('http').Server(app)
  , io    = require('socket.io')(http)
  , R     = require('ramda')
  , crypto = require('crypto');

var redis = require('redis');
var redis_config = JSON.parse(fs.readFileSync('./config/redis.json'));
var client = redis.createClient(redis_config.port, redis_config.host, {no_ready_check:true});
client.auth(redis_config.password);

// Serve the interface
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Socket interface
io.on('connection', function(socket){
	socket.on('takeSnap', function() {
		var identifier = crypto.randomBytes(10).toString('base64');
		client.publish('autoSnap-requests', identifier);
		client.subscribe(identifier);

		client.on('message', function(channel, snap_uri) {
			if(channel === identifier) {
				socket.emit('snapSuccess', snap_uri);
				client.unsubscribe(identifier)
			}
		});
	});
});

// Server
http.listen(3800, function(){
	console.log('autoSnap server listening on port 3000');
});
