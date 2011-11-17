var net = require('net');

function createClient(index, controller) {
  var client = net.createConnection(8000, function() {
     controller.clientConnect(index);
  });
  client.on('message', function(){ controller.clientMessage(index); });
  client.on('disconnect', function(){ controller.clientDisconnect(index); });
  return client;
}

// some libraries use send, others use write etc.
function sendMessage(client, str) {
  client.writable && client.write(str);
}

module.exports = { createClient: createClient, sendMessage: sendMessage };

