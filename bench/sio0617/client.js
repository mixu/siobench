
// SOCKET IO bench
var io = require('node-socket.io-client');

var opts = {
  url: 'localhost',
  transport: 'websocket',
  secure: false,
  port: 8000
};

function createClient(index, controller) {
  var client = new io.Socket(opts.url, opts);
  client.on('connect', function(){ console.log('Client connected', index); controller.clientConnect(index); });
  client.on('message', function(){ controller.clientMessage(index); });
  client.on('disconnect', function(){ controller.clientDisconnect(index); });
  client.connect();

  return client;
}

// some libraries use send, others use write etc.
function sendMessage(client, str) {
  client.send(str);
}

module.exports = { createClient: createClient, sendMessage: sendMessage };
