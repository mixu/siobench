var net = require('net');
var Wormhole = require('wormhole');
var proc = require('./cpu.js');

// the server filename is received via argv
console.log('Server controller started');
// the server file should export a createServer function
if (process.argv.length < 3) {
  console.log('Server file was not specified!');
  process.exit(0);
}
console.log('Loading file', process.argv[2]);
var createServer = require(process.argv[2]);

var Log = require('./server_log.js');

// Server controller
var SC = {};
SC.server = null;
SC.clients = [];
SC.mode = 'stopped';
SC.on = EventEmitter.prototype.on;
SC.once = EventEmitter.prototype.once;
SC.removeListerner = EventEmitter.prototype.removeListener;
SC.removeAllListeners = EventEmitter.prototype.removeAllListeners;
SC.emit = EventEmitter.prototype.emit;

SC.init = function() {
  // we use a timeout to check for the CPU pegged
  setInterval(SC.check, 1000);

  // server channel
  net.createServer(function (ipc) {
    Wormhole(ipc, 'control', function (msg) {
      switch(msg.cmd) {
        case 'status':
          // send back the current state (e.g. pegged or not pegged)
          var m = SC.getCPU();
          console.log('[S] SEND', m);
          ipc.write('control', m);
          break;

        case 'terminate':

        default:
          console.log('RCV SRV MESSAGE', msg);
      }
    });
    // store the ipc client
    SC.clients.push(ipc);
  }).listen(2123);
  // create the server
  SC.server = createServer(SC);
};

SC.check = function() {
  if (proc.isPegged()) {
    // send the pegged message to all clients and the siobench server
    var m = SC.getCPU();
    m.isPegged = true;
    SC.clients.forEach(function(ipc){
      ipc.write('control', m);
    });
  }
};

SC.getCPU = function() {
  var m = {
    cmd: 'server_cpu',
    count: SC.clientcount,
    isPegged: proc.isPegged(),
    cpu: proc.getCPU(),
    mem: process.memoryUsage()
  };
}

SC.terminate = function() {
  logout();
};

SC.clientConnect = function(index) {
  console.log('[S] Client connect');
  // ctime
  logevent(index, 'connect');
  SC.clientcount++;
};

SC.clientMessage = function(index) {
//  console.log('[S] Client message');
  /*
  if(message_counter > 10) {
    results[index].last_message = new Date();
  } else {
    if(message_counter == 1) {
      results[index].first_message = new Date();
    }
  }
  */
};

SC.clientDisconnect = function(index) {
  // dtime
  logevent(index, 'disconnect');
  SC.clientcount--;
};

SC.init();
