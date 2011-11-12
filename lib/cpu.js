// CPU time helper

function getStart() {
  return proc.gettimeofday();
}


function getCPU(start) {
  var current = proc.gettimeofday();
  var walltime = (current - start);
  var systime = proc.getsystime();
  var usertime = proc.getusertime();

  // total cpu time
  var totaltime = systime + usertime;

  return {
    real: walltime,
    user: usertime,
    sys: systime,
    percentage: ( totaltime / walltime) * 100 // total cpu usage
  }
}

module.exports = { getCPU: getCPU, getStart: getStart };
