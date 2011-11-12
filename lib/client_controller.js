var Wormhole = require('wormhole');

var opts = {
  url: 'localhost',
  transport: 'websocket',
  secure: false,
  port: 8000
};


var clients = [];
var results = [];
var current = 0;
var done = 0;


var client = net.createConnection(2122, function() {
    Wormhole(client, 'chat', function (err, msg) {
        // Messages received from server, such as
        // {greet: 'Welcome to our server!'}
    });
    Wormhole(client, 'auth', function (err, msg) {
        // Messages received from server on auth channel, such as
        // {auth: 'Please login!'}
        // {auth: 'Thank you for logging in!'}
    });
    client.write('auth', {user: 'foo', pass: 'bar'});
    client.write('chat', {hello: 'World'});
});


// continuously increase the number of clients
function ramp() {
  if (clients.length < 50) {
    var index = current++;
    var message_counter = 0;
    // store start time
    results[index] = { start: new Date() };
  }
};
setInterval(ramp, 100);

// continously send a message
/*
function broadcast() {
  clients.forEach( function(client) {
    client.publish('test', { state: 'test1'});
  });
  console.log('messages: '+messagecount+' ('+clients.length+')');
}

setInterval(broadcast, 1000);
*/

var Controller = {};

Controller.clientConnect = function(index) {
  console.log('Clients: '+clients.length);
};

Controller.clientMessage = function(index) {
  var client = clients[index];
  if(message_counter > 10) {
    client.disconnect();
  } else {
    client.send(JSON.stringify({ msg: message_counter++ }));
  }
};

Controller.clientDisconnect = function(index) {
  done++;
  if(done >= 50) {
//        end();
  }
}

module.exports = Controller;
