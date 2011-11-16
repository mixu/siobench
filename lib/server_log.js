var proc = require('./cpu_realtime.js');
var fs = require('fs');

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
  console.log('LOG OUT');
  Object.keys(Log.results).forEach(function(index) {
    var result = Log.results[index];
    console.log(result);
    var o = {
      start: Math.floor(result.connect.date.getTime() / 1000), // unix time when connection started
      cpu: result.connect.cpu,
      clients: result.connect.clients
    };
    lines.push(o);
  });
  lines = lines.sort(function(a, b) {
    return a.clients - b.clients; // sort by last column
  });
  var fields = [ 'start', 'cpu', 'clients' ];
  lines.unshift( fields );
  var out = [];
  lines.forEach(function(obj) {
    var line = [];
    fields.forEach(function(field) {
      line.push(obj[field]);
    });
    out.push(line.join('\t'));
  })
  console.log('WRITING FILE');
  fs.writeFile('./out.dat', out.join('\n'), function() {
    console.log('Done');
  });
}

module.exports = Log;
