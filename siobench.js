var fs = require('fs'),
    child_process = require('child_process');
// npm
var proc = require('getrusage');

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
    server: 'server_perf.js',
    client: ''
  }
};

function run(filename) {
  var child = child_process.spawn('node', [filename], { cwd: __dirname });
  child.stdout.on('data', function (data) { console.log(data.toString()); });
  child.stderr.on('data', function (data) { console.log(data.toString()); });
  child.on('exit', function(code, signal) { console.log('Child process exited', code, signal); });
  console.log('Started child process.');
  return child;
}

// run server
var server = run(branches['0.6.17'].server);


// SOCKET IO bench
var io = require('node-socket.io-client');

var opts = {
  url: 'localhost',
  transport: 'websocket',
  secure: false,
  port: 8000
};


var clients = [];
var results = [];
var current = 0;
var done = 0;



// we only calculate CPU time over the current interval
var cpu = [];
var usage = proc.usage();
// store the current gettimeofday in microseconds
var prev_total = usage.systime + usage.usertime;
var prev = proc.gettimeofday();
var start = prev;

//
function getCPU() {
  var usage = proc.usage();
  var current = proc.gettimeofday();
  // total cpu time
  var total = usage.systime + usage.usertime;
  var elapsed_cpu = total - prev_total;
  var elapsed_wall = current - prev;

  console.log('CPU usage since last tick: ', (elapsed_cpu / elapsed_wall) * 100, '%' );
  console.log('CPU usage total: ', (total / (current - start)) * 100, '%');
  console.log(usage);
  prev_total = total;
  prev = current;
}

setInterval(getCPU, 1000);

// continuously increase the number of clients
function ramp() {
  if (clients.length < 50) {
    var index = current++;
    var message_counter = 0;
    // store start time
    results[index] = { start: new Date() };
    var client = new io.Socket(opts.url, opts);
    clients.push(client);
    client.on('connect', function(){
      // ctime
      results[index].connect = new Date();
      client.send(JSON.stringify({ msg: message_counter++ }));
      console.log('Clients: '+clients.length);
    });
    client.on('message', function(){
      if(message_counter > 10) {
        results[index].last_message = new Date();
        client.disconnect();
      } else {
        if(message_counter == 1) {
          results[index].first_message = new Date();
        }
        client.send(JSON.stringify({ msg: message_counter++ }));
      }
    });
    client.on('disconnect', function(){
      // dtime
      results[index].done = new Date();
      done++;
      if(done >= 50) {
//        end();
      }
    });
    client.connect();

  }
};
setInterval(ramp, 100);

// continously send a message
/*
function broadcast() {
  clients.forEach( function(client) {
    client.publish('test', { state: 'test1'});
  });
  console.log('messages: '+messagecount+' ('+clients.length+')');
}

setInterval(broadcast, 1000);
*/

// Mon Nov 07 17:44:10 2011

function end() {
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
    server.exit();
    process.exit();
  });

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
}
