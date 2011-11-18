// CPU time helper
var proc = require('getrusage');

var CPU = {
  total_limit: 5000, // ms
  pegged_limit: 80,
  pegged: false,
  loads: {},
  last: {},
  samples: []
};

// to calculate load average:
// 1) take samples
// 2) fetch samples within the last (1 / 5 / 10 seconds)
// 3) calculate the average of those samples
CPU.loadAvg = function() {
  CPU.last.walltime = proc.gettimeofday();
  CPU.last.systime = proc.getsystime();
  CPU.last.usertime = proc.getusertime();
  // add a single sample
  var o = {
    at: CPU.last.walltime,
    walltime: CPU.last.walltime,
    systime: CPU.last.systime,
    usertime: CPU.last.usertime,
  };
  CPU.samples.push(o);

  // collect the min and max times over 1, 5 and 10 s
  var diffs = { '1s': { max: o, min: o }, '5s': { max: o, min: o }, '10s': { max: o, min: o } };
  // get samples
  CPU.samples = CPU.samples.filter(function(s) {
    // microsecond = 1000 milliseconds, and 1000 milliseconds = 1 second
    if(s.at > CPU.last.walltime - 1000 * 1000) {
      // only min can change, since samples are from the past
      if( s.at < diffs['1s'].min.at ) {
        diffs['1s'].min = s;
      }
    }
    if(s.at > CPU.last.walltime - 5000 * 1000) {
      // only min can change, since samples are from the past
      if( s.at < diffs['5s'].min.at ) {
        diffs['5s'].min = s;
      }
    }
    if(s.at > CPU.last.walltime - 10000 * 1000) {
      // only min can change, since samples are from the past
      if( s.at < diffs['10s'].min.at ) {
        diffs['10s'].min = s;
      }
    }
    // remove values older than 10 s
    return (s.at > CPU.last.walltime - 10000 * 1000);
  });

  // get 1 seconds worth of samples
  var result = CPU.calcUsage(diffs['1s'].min, diffs['1s'].max);
  CPU.loads['1s'] = result.percentage;

  result = CPU.calcUsage(diffs['5s'].min, diffs['5s'].max);
  CPU.loads['5s'] = result.percentage;

  result = CPU.calcUsage(diffs['10s'].min, diffs['10s'].max);
  CPU.loads['10s'] = result.percentage;

};

CPU.calcUsage = function (min, max) {
  var dwalltime = max.walltime - min.walltime;
  var dsystime = max.systime - min.systime;
  var dusertime = max.usertime - min.usertime;
  var dtotaltime = dsystime + dusertime;
  return {
    dwalltime: dwalltime,
    dsystime: dsystime,
    dusertime: dusertime,
    dtotaltime: dtotaltime,
    percentage: (dtotaltime / dwalltime) * 100 // the actually used CPU time over the period, divided by the maximum CPU time
  };
};

CPU.getCPU = function() {
  // pegged is defined as passing over the maximum CPU usage time in microseconds
  if( (CPU.last.usertime + CPU.last.systime) > CPU.total_limit * 1000) {
    CPU.pegged = true;
  } else {
    CPU.pegged = false;
  }
  return {
    real: CPU.last.walltime,
    user: CPU.last.usertime,
    sys: CPU.last.systime,
    percentage: CPU.loads['5s'],
    load_1: CPU.loads['1s'],
    load_5: CPU.loads['5s'],
    load_10: CPU.loads['10s']
  }
};

CPU.isPegged = function (start) {
  return CPU.pegged;
};

CPU.setPeggedLimit = function(limit) {
  CPU.pegged_limit = limit;
};


CPU.loadAvg();
CPU.loadAvg();
// sample at x2 per second
setInterval(function() {
  CPU.loadAvg();
}, 500);

module.exports = CPU;
