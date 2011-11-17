
// SOCKET IO bench
var io = require('socket.io-client');

var opts = {
  transports: ['websocket'],
  'force new connection': true // undocumented option
};

function createClient(index, controller) {
  var client = io.connect('http://localhost:8000', opts);
  client.on('connect', function(){ controller.clientConnect(index); });
  client.on('message', function(){ controller.clientMessage(index); });
  client.on('disconnect', function(){ controller.clientDisconnect(index); });

  return client;
}

// some libraries use send, others use write etc.
function sendMessage(client, str) {
  client.send(str);
}

module.exports = { createClient: createClient, sendMessage: sendMessage };