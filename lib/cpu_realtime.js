// CPU time helper
var proc = require('getrusage');

var CPU = {
  load: 0,
  prev: {},
  current: {}
};

CPU.loadAvg = function() {
  // load average between current and previous values
  CPU.current.walltime = proc.gettimeofday();
  CPU.current.systime = proc.getsystime();
  CPU.current.usertime = proc.getusertime();
  // get 1 seconds worth of samples
  console.log(CPU.prev, CPU.current);
  var result = CPU.calcUsage(CPU.prev, CPU.current);
  CPU.load = result.percentage;

  CPU.prev.walltime = CPU.current.walltime;
  CPU.prev.systime = CPU.current.systime;
  CPU.prev.usertime = CPU.current.usertime;
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
  CPU.loadAvg();
  return {
    real: CPU.prev.walltime,
    user: CPU.prev.usertime,
    sys: CPU.prev.systime,
    percentage: CPU.load,
  }
};

CPU.current.walltime = proc.gettimeofday();
CPU.current.systime = proc.getsystime();
CPU.current.usertime = proc.getusertime();
if(!CPU.prev) {
  CPU.prev.walltime = CPU.current.walltime;
  CPU.prev.systime = CPU.current.systime;
  CPU.prev.usertime = CPU.current.usertime;
}


module.exports = CPU;
