// CPU time helper
var proc = require('getrusage');

var CPU = function() {
  this.pegged_limit = 80;
  this.pegged = false;
};

CPU.prototype.getStart = function() {
  return proc.gettimeofday();
}


CPU.prototype.getCPU = function(start) {
  var current = proc.gettimeofday();
  var walltime = (current - start) / 1000000;
  var systime = proc.getsystime() / 1000000;
  var usertime = proc.getusertime() / 1000000;

  // total cpu time
  var totaltime = systime + usertime;
  // total cpu usage
  var percentage = ( totaltime / walltime) * 100;

  if( percentage > this.pegged_limit) {
    this.pegged = true;
  }

  return {
    real: walltime,
    user: usertime,
    sys: systime,
    percentage: percentage
  }
}

CPU.prototype.isPegged = function (start) {
  if(start) {
    console.log(this.getCPU(start));
  }
  return this.pegged;
}

CPU.prototype.setPeggedLimit = function(limit) {
  this.pegged_limit = limit;
}



module.exports = new CPU(); ;
