var spawn = require('child_process').spawn
var crypto = require('crypto');
var envvar = require('envvar');
var express = require('express');
var fs = require('fs');
var redis = require('redis');

var APP_PORT = envvar.number('APP_PORT', 3800);
var REDIS_PORT = envvar.number('REDIS_PORT', 6379);
var REDIS_HOST = envvar.string('REDIS_HOST', 'localhost');

var client = redis.createClient(REDIS_PORT, REDIS_HOST);

var app = express();
var http = require('http').Server(app)

// Initialize socket.io
var io = require('socket.io')(http);

// Serve the interface
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Socket interface
io.on('connection', function(socket){
  socket.on('autosnap_request', function() {
    var identifier = crypto.randomBytes(10).toString('hex');
    client.publish('autosnap_requests', identifier);

    client.subscribe(identifier);

    client.on('message', function(channel, snap_uri) {
      if(channel === identifier) {
        socket.emit('autosnap_success', snap_uri);
        client.unsubscribe(identifier)
      }
    });
  });
});

// Initialize server
http.listen(APP_PORT, function(){
  console.log('autoSnap server listening on port', APP_PORT);
});
