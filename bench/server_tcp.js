var net = require('net');

function createServer(Controller) {
  var counter = 0;
  var server = net.createServer(function(client){
    var index = counter++;
    Controller.clientConnect(index);

    client.on('data', function(data){
      Controller.clientMessage(index);
      client.write(data);
    });
    client.on('disconnect', function(){
      Controller.clientDisconnect(index);
    });

  });
  server.listen(8000);
  console.log('TCP server listening at 8000');
}

module.exports = createServer;
