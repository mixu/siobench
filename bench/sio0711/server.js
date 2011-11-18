var sio = require('socket.io');

function createServer(Controller) {
  var io = sio.listen(8000);
  io.set('log level', 1);

  console.log('SIO server listening at 8000');

  var counter = 0;
  io.sockets.on('connection', function(client){
    var index = counter++;
    Controller.clientConnect(index);

    client.on('message', function(data){
      Controller.clientMessage(index);
      client.send(data);

    });
    client.on('disconnect', function(){
      Controller.clientDisconnect(index);
    });
  });

}

module.exports = createServer;
