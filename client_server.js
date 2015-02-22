var crypto = require('crypto');

var envvar = require('envvar');
var express = require('express')
var redis = require('redis');
var R = require('ramda');
var S = require('sanctuary');

var APP_PORT = envvar.number('APP_PORT', 3800);
var APP_HOST = envvar.string('APP_HOST');
var REDIS_PORT = envvar.number('REDIS_PORT', 6379);
var REDIS_HOST = envvar.string('REDIS_HOST', 'localhost');
var REDIS_PASS = envvar.string('REDIS_PASS', '');

var publisher = redis.createClient(REDIS_PORT, REDIS_HOST, {
  auth_pass: REDIS_PASS,
});
var client = redis.createClient(REDIS_PORT, REDIS_HOST, {
  auth_pass: REDIS_PASS,
});

var app = express();
var http = require('http').Server(app)

// Initialize socket.io
var io = require('socket.io')(http);

// Serve the interface
app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

// Socket interface
io.on('connection', function(socket) {
  socket.on('autosnap_request', function() {
    var identifier = crypto.randomBytes(10).toString('hex');
    publisher.publish('autosnap_requests', identifier);

    client.subscribe(identifier);

    client.on('message', function(channel, body) {
      if (channel === identifier) {
        var $message;
        try {
          $message = JSON.parse(body);
        } catch (err) {
          $message = {
            error: 'Invalid message',
          };
        };

        if (R.has('error', $message)) {
          socket.emit('autosnap_error', $message.error);
        } else {
          socket.emit('autosnap_success', $message.url);
        }
        client.unsubscribe(identifier);
      }
    });
  });
});

// Initialize server
http.listen(APP_PORT, APP_HOST, function() {
  console.log('autoSnap server listening on port', APP_PORT);
});
