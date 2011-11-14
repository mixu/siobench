var net = require('net');
var Wormhole = require('wormhole');

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

// Server controller
var SC = {};

SC.clients = [];
SC.results = [];
SC.mode = 'stopped';


SC.clientConnect = function(index) {
  // ctime
  SC.results[index] = {};
  SC.results[index].connect = new Date();
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
  SC.results[index].done = new Date();
};

SC.serverExit = function() {

  var lines = [];
  var re = new RegExp('([A-Za-z]+) ([A-Za-z]+) ([0-9]+) ([0-9]+) ([0-9:]+) ([A-Z\-0-9]+) ([\(\)A-Z]+)');
  results.forEach(function(result) {
    // seconds = unix time when connection started
    var conntime = Math.floor(result.connect - result.start); // ctime = Connection time (connect - start)
    var wait = Math.floor(result.first_message - result.connect); // wait = Waiting time
    var work = Math.floor(result.last_message - result.first_message); // wait = Waiting time
    // (between request and reading response, e.g. first_message - start)
    var disctime = Math.floor(result.done - result.last_message); // dtime = Processing time (done - start)
    lines.push([Math.floor(result.start.getTime() / 1000), conntime, wait, work, disctime,
      Math.floor(conntime + wait + work + disctime) // ttime = Total time (ctime + dtime)
       ]);
  });
  lines = lines.sort(function(a, b) {
    return a[a.length - 1] - b[b.length - 1]; // sort by last column
  });

  lines.unshift(['seconds','connect','wait','work','disconnect','total']);
  var out = [];
  lines.forEach(function(line) {
    out.push(line.join('\t'));
  })
  fs.writeFile('./out.dat', out.join('\n'), function() {
    console.log('Done');
  });
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

server = createServer(SC);
