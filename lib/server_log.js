var proc = require('./cpu_realtime.js');
var fs = require('fs');

var path = '.';

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
  var mem = process.memoryUsage();
  // we log all this data
  Log.results[index][name] = {
    date: new Date(),
    real: cpu.real,
    user: cpu.user,
    sys: cpu.sys,
    cpu: cpu.percentage,
    clients: Log.clientcount,
    rss: mem.rss,
    vsize: mem.vsize,
    heapTotal: mem.heapTotal,
    heapUsed: mem.heapUsed
  };
};

// log output:
// - calculate the CPU usage at each client connect
// - calculate the response time
// return an array of lines
Log.out = function(callback) {
  var lines = [];
  Object.keys(Log.results).forEach(function(index) {
    var result = Log.results[index];
    o = result.connect;
    o.start = Math.floor(result.connect.date.getTime() / 1000); // unix time when connection started
    lines.push(o);
  });
  lines = lines.sort(function(a, b) {
    return a.clients - b.clients; // sort by number of clients
  });
  var fields = [ 'start', 'cpu', 'clients', 'real', 'user', 'sys', 'rss', 'vsize', 'heapTotal', 'heapUsed' ];
  var out = [ fields.join('\t') ];
  lines.forEach(function(obj) {
    var line = [];
    fields.forEach(function(field) {
      line.push(obj[field]);
    });
    out.push(line.join('\t'));
  })
  console.log('WRITING FILE', path + '/out.dat');
  fs.writeFile(path + '/out.dat', out.join('\n'), callback);
};

Log.setPath = function(newpath) {
  path = newpath;
};

module.exports = Log;
