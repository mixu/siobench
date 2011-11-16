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
var ipc, sipc;
// Set the pegged detection to 30% only
proc.setPeggedLimit(40);


// Client controller
var Controller = {};

Controller.clients = [];
Controller.current = 0;
Controller.mode = '';
Controller.clientStates = { nop: 0, query_wait: 1 };
Controller.clientState = Controller.clientStates.nop;
Controller.id = -1;
Controller.serverPegged = false;
Controller.actInterval = null;

Controller.on = EventEmitter.prototype.on;
Controller.once = EventEmitter.prototype.once;
Controller.removeListerner = EventEmitter.prototype.removeListener;
Controller.removeAllListeners = EventEmitter.prototype.removeAllListeners;
Controller.emit = EventEmitter.prototype.emit;
Controller.listeners = EventEmitter.prototype.listeners;

var ramp = null;

Controller.init = function() {
  // wait for server to be init
  setTimeout(function() {
    // we use two timeouts
    // a) act -> a short timeout that ramps up the client count quickly
    Controller.actInterval = setInterval(Controller.act, 100);
    // b) maintain -> a long (1s) timeout that sends messages
    setInterval(Controller.maintain, 1000);
  }, 1000);

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
          breakl
        case 'mode':
          ipc.write('control', { cmd: 'status', mode: Controller.mode, id: Controller.id } );
          break;
        case 'start':
          break;
        default:
          console.log('['+Controller.id+'] MESSAGE', msg);
      }
    });
  });

  // connect to the server to ask for whether it is pegged
  sipc = net.createConnection(2123, function() {
    Wormhole(sipc, 'control', function (msg) {
      if (!msg.cmd) {
        return;
      }
      Controller.emit(msg.cmd, msg);
    });
  });

};

// Add a single client
Controller.add = function() {
  var index = Controller.current++;
  // create client
  Controller.clients[index] = createClient(index, Controller);
  Controller.sendUpdate();
};

Controller.act = function() {
  // set mode
  Controller.mode = Controller.getMode();

  switch(Controller.mode) {
    case 'add':
      switch(Controller.clientState) {
        case Controller.clientStates.nop:
          Controller.clientState = Controller.clientStates.query_wait;
          // start a new query
          Controller.on('server_cpu', function(msg) {
//            console.log('Receive', msg);
            if(!msg.isPegged) {
              // start new client
              Controller.add();
              Controller.clientState = Controller.clientStates.nop;
            } else {
              Controller.serverPegged = true;
            }
          });
          // ask for server_cpu
          sipc.write('control', { cmd: 'status' });
          break;
        case Controller.clientStates.query_wait:
          // do nothing
          break;
      }

      break;
    case 'stop':
      // we will clear the act interval the first time we are pegged
      // this is overly conservative, but makes it simpler to deal with multiple clients,
      // since each one goes to it's pegged limit, then the next one continues from there
      return;
  }
};

Controller.maintain = function() {
//  console.log('['+Controller.id+']', 'Clients:', Controller.clientCount(), Controller.getMode());
  Controller.send();
};

Controller.getMode = function() {
  var pegged = proc.isPegged();
  if (pegged || Controller.serverPegged) {
    if(Controller.mode != 'stop') {
      // send a message notifying of stop
      ipc.write('control', { cmd: 'clientStopped', isPegged: proc.isPegged(), isServerPegged: Controller.serverPegged });
      clearInterval(Controller.actInterval);
    }
    return 'stop';
  }
  return 'add';
};

// send a single message on all clients
Controller.send = function() {
  Controller.clients.forEach( function(c) {
    c.send({ state: 'test1'});
  });
//  Controller.sendUpdate();
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
  var cpu = proc.getCPU();
  ipc.write('control', {
    cmd: 'clientCount',
    count: Controller.clientCount(),
    id: Controller.id,
    mode: Controller.mode,
    isPegged: proc.isPegged(),
    cpu: cpu
  });
};

Controller.init();
