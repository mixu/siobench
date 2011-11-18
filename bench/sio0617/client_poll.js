
// SOCKET IO bench
var io = require('node-socket.io-client');

var opts = {
  url: 'localhost',
  transport: 'xhr-polling',
  secure: false,
  port: 8000
};

function createClient(index, controller) {
  var client = new io.Socket(opts.url, opts);
  client.on('connect', function(){ console.log('Client connected', index); controller.clientConnect(index); });
  client.on('message', function(){ controller.clientMessage(index); });
  client.on('disconnect', function(){ console.log('disconnect'); controller.clientDisconnect(index); });

  client.on('connecting', function(){ console.log('connecting'); });
  client.on('connect_failed', function(){ console.log('connect_failed'); });
  client.on('close', function(){ console.log('close'); });
  client.on('reconnecting', function(){ console.log('reconnecting'); });
  client.on('reconnected', function(){ console.log('reconnected'); });
  client.on('reconnect_failed', function(){ console.log('reconnect_failed'); });
  client.connect();

  return client;
}

// some libraries use send, others use write etc.
function sendMessage(client, str) {
  client.send(str);
}

module.exports = { createClient: createClient, sendMessage: sendMessage };
