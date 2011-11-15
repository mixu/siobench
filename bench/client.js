
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
  var message_counter = 0;
  client.on('connect', function(){
    controller.clientConnect(index);

    client.send(JSON.stringify({ msg: message_counter++ }));
  });
  client.on('message', function(){
    controller.clientMessage(index);
  });
  client.on('disconnect', function(){
    controller.clientDisconnect(index);
  });
  client.connect();

  return client;
}

module.exports = createClient;
