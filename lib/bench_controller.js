var child_process = require('child_process'),
    net = require('net'),
    repl = require('repl'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;
// npm
var proc = require('getrusage');
var Wormhole = require('wormhole');

function run(params) {
  var child = child_process.spawn('node', params, { cwd: __dirname });
  child.stdout.on('data', function (data) { console.log(data.toString().trim()); });
  child.stderr.on('data', function (data) { console.log(data.toString().trim()); });
  child.on('exit', function(code, signal) { console.log('Child process exited', code, signal); });
  console.log('Started process.');
  return child;
}

var SB = function() {
  this.clients = [];
  // we want a pool of processes to generate load
  // create the server for load generation pool
  this.prev_pegged = false;
  this.ipc = null;
};

util.inherits(SB, EventEmitter);

SB.prototype.start = function(opts) {
  var self = this;
  // start the server to benchmark against
  var server = run(['./server_controller.js',  opts.server, opts.out ]);
  this.ipc = net.createServer(function (client) {
    self.clients.push({
      client: client,
      count: {}
    });
    // Control channel handler
    Wormhole(client, 'control', function (msg) {
      // sadasda.asdasd = asdasd;
      if (!msg.cmd) {
        console.log('IGNORE');
        return;
      }
      switch(msg.cmd) {
        case 'clientCount':
          self.clients[msg.id].count = msg;
          break;
        case 'clientStopped':
          if(!msg.isServerPegged) {
            // not because server is pegged, so start another client
            run(['./client_controller.js', opts.client ]);
          } else {
            console.log('SERVER PEGGED!');
            // now trigger the logging on the server side
            sipc = net.createConnection(2123, function() {
              Wormhole(sipc, 'control', function (msg) {});
              sipc.write('control', { cmd: 'terminate' });
            });
          }
          break;
        case 'done':
            // server has finished writing the log, so terminate
            console.log('emit done');
            self.emit('done');

            // close after emit
            self.ipc.close();
            sipc.close();

          break;
        default:
          console.log('RCV MESSAGE', msg);
      }
    });
    Wormhole(client, '__error__', function(err) {
        console.error("Error received: ", err.msg);
        console.error(err.stack);
    });
    Wormhole(client, '__unknown__', function(msg, fd, channel) {
        console.log("Received message on unknown channel", channel,":", msg);
    });
    // get the current mode from the client
    client.write('control', { cmd: 'id', id: self.clients.length-1 });
    client.write('control', { cmd: 'mode' });
    client.write('control', { cmd: 'start'} );
  }).listen(2122);

  // allow the server to start... hacky
  setTimeout(function() {
    // start one client controller
    run(['./client_controller.js', opts.client ]);
  }, 3000);

};

SB.prototype.status = function() {
  console.log('Number of clients: ', this.clients.length);
  console.log('Client CPU usage:');
  var total = 0;
  this.clients.forEach(function(o) {
    total += o.count.count;
    console.log( o.count);
  });
  console.log('Total client connections', total);
};

module.exports = SB;
