var net = require('net');
var path = require('path');
var Wormhole = require('wormhole');
var proc = require('./cpu.js');
var EventEmitter = require('events').EventEmitter;

proc.setPeggedLimit(65);

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
// path to save logs to
var outpath = (process.argv.length > 3 ? process.argv[3] : path.dirname(process.argv[2]));
// make the dir using substack's mkdirp
require('mkdirp').sync(outpath, 0755);
Log.setPath(outpath);

// Server controller
var SC = {};
SC.server = null;
SC.clients = [];
SC.mode = 'stopped';
SC.checkInterval = null;
SC.on = EventEmitter.prototype.on;
SC.once = EventEmitter.prototype.once;
SC.removeListener = EventEmitter.prototype.removeListener;
SC.removeAllListeners = EventEmitter.prototype.removeAllListeners;
SC.emit = EventEmitter.prototype.emit;

SC.init = function() {
  // we use a timeout to check for the CPU pegged
  SC.checkInterval = setInterval(SC.check, 1000);

  // server channel
  net.createServer(function (ipc) {
    Wormhole(ipc, 'control', function (msg) {
      switch(msg.cmd) {
        case 'status':
          // send back the current state (e.g. pegged or not pegged)
          var m = SC.getCPU();
//          console.log('[S] Status: ', m);
          ipc.write('control', m);
          break;
        case 'terminate':
          console.log('Server terminating');
          SC.terminate();
          break;
        default:
          console.log('Unknown server message', msg);
      }
    });
    Wormhole(ipc, '__error__', function(err) {
        console.error("Error received: ", err.msg);
        console.error(err.stack);
    });
    Wormhole(ipc, '__unknown__', function(msg, fd, channel) {
        console.log("Received message on unknown channel", channel,":", msg);
    });
    // store the ipc client
    SC.clients.push(ipc);
  }).listen(2123);
  console.log('Creating a new server');
  // create the server
  SC.server = createServer(SC);
};

SC.check = function() {
  if (proc.isPegged()) {
    // send the pegged message to all clients and the siobench server
    var m = SC.getCPU();
    m.isPegged = true;
    SC.clients.forEach(function(ipc){
      ipc.writable && ipc.write('control', m);
    });
  }
};

SC.getCPU = function() {
  return {
    cmd: 'server_cpu',
    count: Log.clientcount,
    isPegged: proc.isPegged(),
    cpu: proc.getCPU(),
    mem: process.memoryUsage()
  };
}

SC.terminate = function() {
  console.log('Sending EXIT');
  // send the exit signal to all clients
  SC.clients.forEach(function(ipc){
    ipc.write('control', { 'cmd': 'done' });
  });
  console.log('WRITING LOG');
  Log.out(function() {
    console.log('Done');
    clearInterval(SC.checkInterval);
    sipc = net.createConnection(2122, function() {
      Wormhole(sipc, 'control', function (msg) {});
      sipc.write('control', { cmd: 'done' });
      process.exit(0);
    });
  });
};

SC.clientConnect = function(index) {
  Log.event(index, 'connect');
};

SC.clientMessage = function(index) {
//  console.log('[S] Client message');
};

SC.clientDisconnect = function(index) {
  Log.event(index, 'disconnect');
};

SC.init();
