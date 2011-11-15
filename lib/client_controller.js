var net = require('net');
var Wormhole = require('wormhole');
var proc = require('./cpu.js');
var EventEmitter = require('events').EventEmitter;

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

Controller.on = EventEmitter.prototype.on;
Controller.once = EventEmitter.prototype.once;
Controller.removeListerner = EventEmitter.prototype.removeListener;
Controller.removeAllListeners = EventEmitter.prototype.removeAllListeners;
Controller.emit = EventEmitter.prototype.emit;

var ramp = null;

Controller.init = function() {
  // we use two timeouts
  // a) act -> a short timeout that ramps up the client count quickly
  setInterval(Controller.act, 10);
  // b) maintain -> a long (1s) timeout that sends messages
  setInterval(Controller.maintain, 1000);

  // there are two IPC connections, one for siobench and another for the server

  // IPC handler - this takes care of notifying siobench that we are stopped
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
        default:
          console.log('['+Controller.id+'] MESSAGE', msg);
      }
    });
  });

  // connect to the server to ask for whether it is pegged
  sipc = net.createConnection(2122, function() {
    Wormhole(ipc, 'control', function (msg) {

    });
  });

};

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

Controller.act = function() {
  // set mode
  Controller.mode = (proc.isPegged() ? 'stop' : 'add');

  switch(Controller.mode) {
    case 'start':

      break;
    case 'stop':
      // we will clear the act interval the first time we are pegged
      // this is overly conservative, but makes it simpler to deal with multiple clients,
      // since each one goes to it's pegged limit, then the next one continues from there
      return;
  }
};

Controller.maintain = function() {
  Controller.send();
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
    cpu: cpu
  });
};

Controller.getServerLoad = function() {
  sipc.write('control', { cmd: 'status' });
};

