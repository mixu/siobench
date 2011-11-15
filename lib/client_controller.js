var net = require('net');
var Wormhole = require('wormhole');

// the client filename is received via argv
console.log('Client controller started');
// the client file should export a createClient function
if (process.argv.length < 3) {
  console.log('Client file was not specified!');
  process.exit(0);
}
console.log('Loading file', process.argv[2]);
var createClient = require(process.argv[2]);

// IPC client
var ipc;

// Client controller
var Controller = {};

Controller.clients = [];
Controller.current = 0;
Controller.mode = 'stopped';
Controller.id = -1;

// Add a single client
Controller.add = function() {
  var index = Controller.current++;
  // create client
  Controller.clients[index] = createClient(index, Controller);
};

// send a single message on all clients
Controller.send = function() {
  Controller.clients.forEach( function(client) {
    client.publish('test', { state: 'test1'});
  });
};

// client count, ignoring clients set to null
Controller.clientCount = function() {
  var count = 0;
  Controller.clients.forEach(function(c) {
    if(c) {
      count++;
    }
  });
  return count;
};

Controller.clientConnect = function(index) {
  console.log('Clients: '+Controller.clientCount());
  ipc.write('control', { cmd: 'clientCount', count: Controller.clientCount(), id: Controller.id });
};

Controller.clientMessage = function(index) {
  var client = Controller.clients[index];
  /*
  if(message_counter > 10) {
    client.disconnect();
  } else {
    client.send(JSON.stringify({ msg: message_counter++ }));
  }
  */
};

Controller.clientDisconnect = function(index) {
  ipc.write({ cmd: 'clientCount', count: Controller.clientCount(), id: Controller.id });
};

// IPC handler
ipc = net.createConnection(2122, function() {
  Wormhole(ipc, 'control', function (msg) {
    console.log('['+Controller.id+'] MESSAGE', msg);
    if (!msg.cmd) {
      return;
    }
    switch(msg.cmd) {
      case 'id':
        Controller.id = msg.id;
      case 'mode':
        ipc.write('control', { cmd: 'status', mode: Controller.mode, id: Controller.id } );
        break;
      case 'add':
        console.log('ADDING new');
        Controller.add();
        break;
    }
  });
});


