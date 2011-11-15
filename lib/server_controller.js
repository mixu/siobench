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

// IPC client
var ipc;
// Server
var server;
// starttime
var start

// Server controller
var SC = {};

SC.clients = [];
SC.mode = 'stopped';

// results is an array indexed by client index
// each object is: { connect: [ time, CPU ], message: [ time, CPU ], disconnect: [ time, CPU ] }
SC.results = [];

// log event - logs the:
//  - date
//  - current cpu usage
//  - number of connected clients
// name = 'connect', 'message', 'disconnect'
function logevent(index, name) {
  SC.results[index] || (SC.results[index] = {});
  var cpu = proc.getCPU(start);
  SC.results[index][name] = {
    date: new Date(),
    real: cpu.real,
    user: cpu.user,
    sys: cpu.sys,
    cpu: cpu.percentage,
    clients: SC.clientCount()
  };
}

// log output:
// - calculate the CPU usage at each client connect
// - calculate the response time
// return an array of lines
function logout() {
  var lines = [];
  results.forEach(function(result) {
    var o = {
      start: Math.floor(result.start.getTime() / 1000), // unix time when connection started
      connect: Math.floor(result.connect - result.start), // ctime = Connection time (connect - start)
      wait: Math.floor(result.first_message - result.connect), // wait = Waiting time
      work: Math.floor(result.last_message - result.first_message), // wait = Waiting time
      // (between request and reading response, e.g. first_message - start)
      disconnect: Math.floor(result.done - result.last_message) // dtime = Processing time (done - start)
    };
    o.total =  Math.floor(o.connect + o.wait + o.work + o.disconnect); // ttime = Total time (ctime + dtime)
    lines.push(o);
  });
  lines = lines.sort(function(a, b) {
    return a[a.length - 1] - b[b.length - 1]; // sort by last column
  });
  return lines;
}

function logwrite(lines) {
  var fields = [ 'start', 'connect', 'wait', 'work', 'disconnect', 'total' ];
  lines.unshift( fields );
  var out = [];
  lines.forEach(function(obj) {
    var line = [];
    fields.forEach(function(field) {
      line.push(obj[field]);
    });
    out.push(line.join('\t'));
  })
  fs.writeFile('./out.dat', out.join('\n'), function() {
    console.log('Done');
  });
}

SC.clientCount = function() {
  var count = 0;
  SC.clients.forEach(function(c) {
    if(c) {
      count++;
    }
  });
  return count;
};

SC.clientConnect = function(index) {
  // ctime
  logevent(index, 'connect');
};

SC.clientMessage = function(index) {
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
};

SC.serverExit = function() {


};

// IPC handler
ipc = net.createConnection(2122, function() {
  Wormhole(ipc, 'scontrol', function (msg) {
    console.log('SERVER MESSAGE', msg);
    if (!msg.cmd) {
      return;
    }
    switch(msg.cmd) {
      case 'mode':
        ipc.write('control', { cmd: 'status', mode: Controller.mode } );
        break;
      case 'add':
        Controller.add();
        break;
    }
  });
});

// start the server
start = proc.getStart();
server = createServer(SC);
