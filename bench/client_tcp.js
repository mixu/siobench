var net = require('net');

function createClient(index, controller) {
  var client = net.createConnection(8000, function() {
     controller.clientConnect(index);
  });
  client.on('message', function(){ controller.clientMessage(index); });
  client.on('disconnect', function(){ controller.clientDisconnect(index); });
//  client.connect(8000);
  return client;
}

module.exports = createClient;
