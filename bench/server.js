var http = require('http'),
      io = require('socket.io');

var ServerController = require('./lib/server_controller.js');

var server = http.createServer(function(req, res){
    res.end('Server running');
});

server.listen(8000);

var socket = io.listen(server);

socket.on('connection', function(client){

  BenchLog.clientConnect();

  client.on('message', function(data){
    client.send(data);

    BenchLog.clientMessage();

  });
  client.on('disconnect', function(){
    BenchLog.clientDisconnect();
  });
});

process.on('exit', function() {
  BenchLog.serverExit();
});

