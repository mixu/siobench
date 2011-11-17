var environments = require('./bench/index.js');
var series = require('./lib/series.js');
var SB = require('./lib/bench_controller.js');

if(process.argv.length < 3) {
  console.log('Usage: node siobench.js [env]');
  console.log('A tool for benchmarking your Socket.io server.');
  console.log('');
  console.log('Available environments:');
  Object.keys(environments).forEach(function(environment) {
    console.log('\t'+environment);
  });
  process.exit();
}

var tasks = [];
process.argv.slice(2).forEach(function(spec) {
  Object.keys(environments).forEach(function(environment) {
    if(environment.indexOf(spec) > -1) {
      var env = environments[spec];
      tasks.push(function(next) {
        console.log('Checking environment', environment);

        var bench = new SB();
        bench.on('done', function() {
          console.log('SB = done');
          next();
        });
        bench.start({
          server: __dirname +'/'+ env.server,
          client: __dirname +'/'+ env.client
        });
      });
    }
  });
});

series(tasks, function() {
  console.log('Benchmarks completed.');
  process.exit(0);
});


/*

  console.log('  -c   Number of concurrent requests to perform at one time. Default: 1.');
  console.log('  -n   Total number of requests for the benchmarking session.');
  console.log('  -m   Number of messages per connection. Default: 0.');
  console.log('  -t   Transport to use: "websocket" or "xhr-polling".');
  console.log('  -r   Rate of connections per second. Default: 0.');
  console.log('  -s   Size of messages to send, in bytes. Default: 32.');
  console.log('  -g   Write all measured values as a gnuplot (tab separated value) file.');
  console.log('  -p   Number of processes to use in load generation.')
var options = {
  concurrency: 2,
  num_connections: 100,
  num_messages: 10,
  transport: 'xhr-polling',
  rate: 10,
  message_size: 32
};

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

