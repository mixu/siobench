// CPU time helper
var proc = require('getrusage');

var CPU = function() {
  this.pegged_limit = 80;
  this.pegged = false;
  this.lastCPU = 0;
  // take the last 100 measurements
  this.measures = [];
};




CPU.prototype.getStart = function() {
  return proc.gettimeofday();
};

CPU.prototype.getCPU = function(start) {
  var current = proc.gettimeofday();
  var walltime = (current - start) / 1000000;
  var systime = proc.getsystime() / 1000000;
  var usertime = proc.getusertime() / 1000000;

  // total cpu time
  var totaltime = systime + usertime;
  // total cpu usage
  var percentage = ( totaltime / walltime) * 100;

  this.measures = this.measures.splice(-10, 10);
  this.measures.push(percentage);

//  console.log(this.measures);

  var total = this.measures.reduce(function(prev, current) { return prev + current; }, 0);
  percentage = total / this.measures.length;

  this.pegged = (percentage > this.pegged_limit);
  this.lastCPU = percentage;
  return {
    real: walltime,
    user: usertime,
    sys: systime,
    percentage: percentage
  }
};

CPU.prototype.isPegged = function (start) {
  if(start) {
    this.getCPU(start);
  }
  return this.pegged;
};

CPU.prototype.setPeggedLimit = function(limit) {
  this.pegged_limit = limit;
};

CPU.prototype.getLastCPU = function() {
  return this.lastCPU;
};


module.exports = new CPU(); ;
