var proc = require('./cpu.js');

var Log = {
  // results is an array indexed by client index
  // each object is: { connect: [ time, CPU ], message: [ time, CPU ], disconnect: [ time, CPU ] }
  results:  {},
  clientcount: 0
};

// log event - logs the:
//  - date
//  - current cpu usage
//  - number of connected clients
// name = 'connect', 'message', 'disconnect'
Log.event = function (index, name) {
  Log.results[index] || (Log.results[index] = {});
  var cpu = proc.getCPU();
  // client counter
  if(name == 'connect') {
    Log.clientcount++;
  } else if(name == 'disconnect') {
    Log.clientcount--;
  }
  // we log all this data
  Log.results[index][name] = {
    date: new Date(),
    real: cpu.real,
    user: cpu.user,
    sys: cpu.sys,
    cpu: cpu.percentage,
    clients: Log.clientcount
  };
};

// log output:
// - calculate the CPU usage at each client connect
// - calculate the response time
// return an array of lines
Log.out = function() {
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

module.exports = Log;
