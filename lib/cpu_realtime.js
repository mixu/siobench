// CPU time helper
var proc = require('getrusage');

var CPU = {
  loads: {},
  last: {},
  samples: []
};

var SAMPLE_SPEED = 100;

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
  var max = o;
  var min = o;
  // get samples
  CPU.samples = CPU.samples.filter(function(s) {
    // microsecond = 1000 milliseconds, and 1000 milliseconds = 1 second
    // only min can change, since samples are from the past
    if( s.at < min.at ) {
      min = s;
    }
    // remove values older than 100 ms
    return (s.at > CPU.last.walltime - SAMPLE_SPEED * 10 * 1000);
  });

  var result = CPU.calcUsage(min, max);
  CPU.load = result.percentage;

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
  return {
    real: proc.gettimeofday(),
    user: proc.getsystime(),
    sys: proc.getusertime(),
    percentage: CPU.load,
  }
};


CPU.loadAvg();
CPU.loadAvg();
// sample speed
setInterval(function() {
  CPU.loadAvg();
}, SAMPLE_SPEED);

module.exports = CPU;
