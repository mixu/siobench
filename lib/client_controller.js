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

var benchClient = require(process.argv[2]);
var createClient = benchClient.createClient;

// IPC client
var ipc, sipc;
// Set the pegged detection to 30% only
proc.setPeggedLimit(40);


// Client controller
var Controller = {};

Controller.clients = [];
Controller.current = 0;
Controller.clientStates = { stopped: -1, begin: 0, connect_wait: 1, connected: 2, query_wait: 3 };
Controller.clientState = Controller.clientStates.begin;
Controller.id = -1;
Controller.serverPegged = false;
Controller.sendInterval = null;

Controller.on = EventEmitter.prototype.on;
Controller.once = EventEmitter.prototype.once;
Controller.removeListener = EventEmitter.prototype.removeListener;
Controller.removeAllListeners = EventEmitter.prototype.removeAllListeners;
Controller.emit = EventEmitter.prototype.emit;
Controller.listeners = EventEmitter.prototype.listeners;

var ramp = null;

Controller.init = function() {
  // wait for server to be init
  setTimeout(function() {
    // maintain -> a long (1s) timeout that sends messages
    setInterval(Controller.maintain, 1000);
  }, 1000);

  Controller.on('server_cpu', function(msg) {
//    console.log('Receive', msg);
    if(!msg.isPegged) {
      // start new client
      if(Controller.clientState == Controller.clientStates.query_wait) {
        Controller.clientState = Controller.clientStates.begin;
      }
    } else {
      Controller.serverPegged = true;
    }
    process.nextTick(function() {
      Controller.act();
    });
  });

  // there are two IPC connections, one for siobench and another for the server

  // IPC handler - this takes care of notifying siobench that we are stopped
  ipc = net.createConnection(2122, function() {
    Wormhole(ipc, 'control', function (msg) {
      console.log('['+Controller.id+'] MESSAGE', msg);
      if (!msg.cmd) {
        return;
      }
      switch(msg.cmd) {
        case 'id':
          Controller.id = msg.id;
          break;
        case 'mode':
          ipc.write('control', {
            cmd: 'status',
            mode: (Controller.clientState > Controller.clientStates.stopped ? 'add' : 'stop'),
            id: Controller.id
          });
          break;
        case 'start':
          process.nextTick(function() {
            Controller.act();
          });
          setInterval(function() {
            Controller.act();
          }, 1000);

          break;
        default:
          console.log('['+Controller.id+'] MESSAGE', msg);
      }
    });
    Wormhole(ipc, '__error__', function(err) {
        console.error("Error received: ", err.msg);
        console.error(err.stack);
    });
    Wormhole(ipc, '__unknown__', function(msg, fd, channel) {
        console.log("Received message on unknown channel", channel,":", msg);
    });
  });

  // connect to the server to ask for whether it is pegged
  sipc = net.createConnection(2123, function() {
    Wormhole(sipc, 'control', function (msg) {
      if (!msg.cmd) {
        return;
      }
      if(msg.cmd ==  'done') {
          console.log('RCV DONE CLIENT', msg);
          Controller.clientState = Controller.clientStates.stopped;
          clearInterval(Controller.sendInterval);
          process.exit(0);
      }
      Controller.emit(msg.cmd, msg);
    });
    Wormhole(sipc, '__error__', function(err) {
        console.error("Error received: ", err.msg);
        console.error(err.stack);
    });
    Wormhole(sipc, '__unknown__', function(msg, fd, channel) {
        console.log("Received message on unknown channel", channel,":", msg);
    });
  });

};


Controller.act = function() {
  // set mode
  if (Controller.serverPegged || proc.isPegged()) {
    if(Controller.clientState != Controller.clientStates.stopped) {
      // send a message notifying of stop
      console.log('PEGGED', { cmd: 'clientStopped', isPegged: proc.isPegged(), isServerPegged: Controller.serverPegged });
      ipc.write('control', { cmd: 'clientStopped', isPegged: proc.isPegged(), isServerPegged: Controller.serverPegged });
      Controller.clientState = Controller.clientStates.stopped;
    }
  }
  console.log('act', Controller.clientState);

  switch(Controller.clientState) {
    case Controller.clientStates.stopped:
      // do nothing
      break;
    case Controller.clientStates.begin:
      // connect a client
      Controller.clientState = Controller.clientStates.connect_wait;
      var index = Controller.current++;
      // create client
      console.log('Creating new client');
      Controller.clients[index] = createClient(index, Controller);
      console.log('Client connecting' );

      // short circuit the check...
//      sipc.write('control', { cmd: 'status' });
//      Controller.clientState = Controller.clientStates.connected;
      break;
    case Controller.clientStates.connect_wait:
      // do nothing
      break;
    case Controller.clientStates.connected:
      // perform query
      Controller.clientState = Controller.clientStates.query_wait;
      // ask for server_cpu
      sipc.write('control', { cmd: 'status' });
      break;
    case Controller.clientStates.query_wait:
      // do nothing
      break;
  }
};

Controller.maintain = function() {
  Controller.send();
};

// send a single message on all clients
Controller.send = function() {
  var msg = JSON.stringify({ state: 'test1'});
  Controller.clients.forEach( function(c) {
    benchClient.sendMessage(c, msg);
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
  console.log('Client connected EVENT', index);
  if(Controller.clientState == Controller.clientStates.connect_wait) {
    Controller.clientState = Controller.clientStates.connected;
  }
  process.nextTick(function() {
    Controller.act();
  });
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
