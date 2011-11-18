var http = require('http'),
      io = require('socket.io');

function createServer(Controller) {
  var server = http.createServer(function(req, res){
      res.end('Server running');
  });
  server.listen(8000);
  console.log('SIO server listening at 8000');

  var socket = io.listen(server);
  var counter = 0;
  socket.on('connection', function(client){
    console.log('CONNECTION', client.sessionId);
    var index = counter++;
    Controller.clientConnect(index);

    client.on('message', function(data){
      Controller.clientMessage(index);
      client.send(data);

    });
    client.on('disconnect', function(){
      console.log('DISCONNECT', client.sessionId);
      Controller.clientDisconnect(index);
    });
  });

}

module.exports = createServer;
