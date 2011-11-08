var fs = require('fs');

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
}

var options = {
  concurrency: 2,
  num_connections: 100,
  num_messages: 10,
  transport: 'xhr-polling',
  rate: 10,
  message_size: 32
};


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

// continuously increase the number of clients
function ramp() {
  if (clients.length < 50) {
    var index = current++;
    // store start time
    results[index] = { start: new Date() };
    var client = new io.Socket(opts.url, opts);
    clients.push(client);
    client.on('connect', function(){
      // ctime
      results[index].connect = new Date();
      client.send(JSON.stringify({ msg: 'aaa' }));
      console.log('Clients: '+clients.length);
    });
    client.on('message', function(){
      results[index].message = new Date();
      client.disconnect();
    });
    client.on('disconnect', function(){
      // dtime
      results[index].done = new Date();
      done++;
      if(done >= 50) {
        end();
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
    // starttime = Date when connection started
    // seconds = unix time when connection started
    var ctime = Math.floor(result.connect - result.start); // ctime = Connection time (connect - start)
    var wait = Math.floor(result.message - result.start); // wait = Waiting time
    // (between request and reading response, e.g. first_message - start)
    var dtime = Math.floor(result.done - result.start); // dtime = Processing time (done - start)
    lines.push([result.start.toString().replace(re, '$1 $2 $3 $5 $4'), Math.floor(result.start.getTime() / 1000), ctime, dtime,
      Math.floor(ctime + dtime), // ttime = Total time (ctime + dtime)
      wait ]);
  });
  lines = lines.sort(function(a, b) {
    return a[4] - b[4]; // sort by ttime
  });

  lines.unshift(['starttime','seconds','ctime','dtime','ttime','wait']);
  var out = [];
  lines.forEach(function(line) {
    out.push(line.join('\t'));
  })
  fs.writeFile('./out.dat', out.join('\n'), function() {
    console.log('Done');
    process.exit();
  });
}
