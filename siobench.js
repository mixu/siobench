var path = require('path');
var environments = require('./environments.js');
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
    if(environment == spec) {
      var env = environments[spec];
      tasks.push(function(next) {
        console.log('Checking environment', environment);

        var bench = new SB();
        bench.on('done', function() {
          console.log('SB = done');
          next();
        });
        bench.start({
          server: path.normalize(__dirname +'/'+ env.server),
          client: path.normalize(__dirname +'/'+ env.client),
          out: path.normalize(__dirname +'/'+ env.out)
        });
      });
    }
  });
});

if(tasks.length == 0) {
  console.log('No environments matching', process.argv.slice(2), 'found');
} else {
  series(tasks, function() {
    console.log('Benchmarks completed.');
    process.exit(0);
  });
}


