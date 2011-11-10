var http = require('http'),
      io = require('socket.io');

var server = http.createServer(function(req, res){
    res.end('Server running');
});

server.listen(8000);

var socket = io.listen(server);

socket.on('connection', function(client){
  client.on('message', function(data){
    client.send(data);
  });
  client.on('disconnect', function(){
  });
});
