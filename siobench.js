var fs = require('fs'),
    child_process = require('child_process'),
    net = require('net');
// npm
var proc = require('getrusage');
var Wormhole = require('wormhole');

if(process.argv.length > 2) {
  console.log('Usage: node siobench.js [options] host port');
  console.log('A tool for benchmarking your Socket.io server.');
  console.log('');
  console.log('Available options:');
  console.log('  -c   Number of concurrent requests to perform at one time. Default: 1.');
  console.log('  -n   Total number of requests for the benchmarking session.');
  console.log('  -m   Number of messages per connection. Default: 0.');
  console.log('  -t   Transport to use: "websocket" or "xhr-polling".');
  console.log('  -r   Rate of connections per second. Default: 0.');
  console.log('  -s   Size of messages to send, in bytes. Default: 32.');
  console.log('  -g   Write all measured values as a gnuplot (tab separated value) file.');
  console.log('  -p   Number of processes to use in load generation.')
}

var options = {
  concurrency: 2,
  num_connections: 100,
  num_messages: 10,
  transport: 'xhr-polling',
  rate: 10,
  message_size: 32
};

var branches = {
  '0.6.17': {
    server: './bench/server.js',
    client: './bench/client.js'
  }
};

function run(params) {
  var child = child_process.spawn('node', params, { cwd: __dirname });
  child.stdout.on('data', function (data) { console.log(data.toString().replace('\n', '')); });
  child.stderr.on('data', function (data) { console.log(data.toString().replace('\n', '')); });
  child.on('exit', function(code, signal) { console.log('Child process exited', code, signal); });
  console.log('Started process.');
  return child;
}

// start the server to benchmark against
var server = run(['./lib/server_controller.js', __dirname+'/bench/server.js' ]);

var index = 0;
var clients = [];

// we want a pool of processes to generate load
// create the server for load generation pool
var prev_pegged = false;
net.createServer(function (client) {
  clients.push(client);
  // Control channel handler
  Wormhole(client, 'control', function (msg) {
    // sadasda.asdasd = asdasd;
    if (!msg.cmd) {
      console.log('IGNORE');
      return;
    }
    switch(msg.cmd) {
      case 'clientCount':
          console.log('[C]', msg);
//        client_counts[msg.id] = msg.count;
        if(msg.isPegged) {
          if (msg.isPegged != prev_pegged) {
          }
          prev_pegged = msg.isPegged;
        } else {
          client.write('control', { cmd: 'add'} );
        }
        break;
      default:
        console.log('RCV MESSAGE', msg);
    }
  });
  // get the current mode from the client
  client.write('control', { cmd: 'id', id: index++ });
  client.write('control', { cmd: 'mode' });
  client.write('control', { cmd: 'add'} );
}).listen(2122);

// server channel
net.createServer(function (srv) {
  Wormhole(srv, 'control', function (msg) {
    switch(msg.cmd) {
      case 'cpu':
        console.log('[S] isPegged', msg.isPegged);

        // use the 10-second averate to decide whether to add more load


        break;
      default:
          console.log('RCV SRV MESSAGE', msg);
    }
  });
}).listen(2123);


// start one client controller
run(['./lib/client_controller.js', __dirname+'/bench/client.js' ]);


/*
Concurrency Level:      10
Time taken for tests:   14.793312 seconds
Complete requests:      1000
Failed requests:        0
Write errors:           0
Total transferred:      83608000 bytes
HTML transferred:       83241000 bytes
Requests per second:    67.60 [#/sec] (mean)
Time per request:       147.933 [ms] (mean)
Time per request:       14.793 [ms] (mean, across all concurrent requests)
Transfer rate:          5519.25 [Kbytes/sec] received

Connection Times (ms)
              min  mean[+/-sd] median   max
Connect:        0   20 250.2      0    3000
Processing:    53  126  52.7    120     317
Waiting:       19   51  29.5     46     246
Total:         53  147 260.2    120    3305

Percentage of the requests served within a certain time (ms)
  50%    120
  66%    142
  75%    159
  80%    172
  90%    198
  95%    227
  98%    282
  99%    314
 100%   3305 (longest request)

*/

