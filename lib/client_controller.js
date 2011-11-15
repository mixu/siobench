var net = require('net');
var Wormhole = require('wormhole');
var proc = require('./cpu.js');

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
var start = proc.getStart();
// Set the pegged detection to 30% only
proc.setPeggedLimit(40);


// Client controller
var Controller = {};

Controller.clients = [];
Controller.current = 0;
Controller.mode = 'stopped';
Controller.id = -1;

var ramp = null;

// Add a single client
Controller.add = function() {
  if(ramp == null) {
    ramp = setTimeout(function() {
      var index = Controller.current++;
      // create client
      Controller.clients[index] = createClient(index, Controller);
      Controller.sendUpdate();
      ramp = null;
    }, 10);
  }

};

// send a single message on all clients
Controller.send = function() {
  Controller.clients.forEach( function(c) {
    c.send({ state: 'test1'});
  });
  Controller.sendUpdate();
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
  Controller.sendUpdate();
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
  Controller.sendUpdate();
};

Controller.sendUpdate = function() {
  var cpu = proc.getCPU(start);
  ipc.write('control', {
    cmd: 'clientCount',
    count: Controller.clientCount(),
    id: Controller.id,
    isPegged: proc.isPegged(start),
    cpu: cpu,
    mem: process.memoryUsage()
  });
};

// IPC handler
ipc = net.createConnection(2122, function() {
  Wormhole(ipc, 'control', function (msg) {
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
        Controller.add();
        break;
      case 'stop':

        break;
      case 'send':
        Controller.send();
        Controller.sendUpdate();
        break;
      default:
        console.log('['+Controller.id+'] MESSAGE', msg);
    }
  });

});


setInterval(function() {
  Controller.send();
}, 1000);
