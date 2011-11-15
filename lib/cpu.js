// CPU time helper
var proc = require('getrusage');

var CPU = function() {
  this.pegged_limit = 80;
  this.pegged = false;
  this.lastCPU = 0;
  // take the last 100 measurements
  this.measures = [];
  this.loads = {};

  //
  this.samples = [];
  this.last = {
    walltime: proc.gettimeofday(),
    systime: proc.getsystime(),
    usertime: proc.getusertime()
  };
};


// to calculate load average:
// 1) take samples
// 2) fetch samples within the last (1 / 5 / 10 seconds)
// 3) calculate the average of those samples


CPU.prototype.loadAvg = function() {
  var current = proc.gettimeofday();
  var systime = proc.getsystime();
  var usertime = proc.getusertime();
  // add a single sample
  var o = {
    at: current,
    dwalltime: (current - this.last.walltime),
    dsystime: (systime - this.last.systime),
    dusertime:  (usertime - this.last.usertime)
  };
  o.dtotaltime = o.dsystime + o.dusertime;
  o.percentage = ( o.dtotaltime / o.dwalltime) * 100; // the actually used CPU time over the period, divided by the maximum CPU time
  this.samples.push(o);

  this.last.walltime = current;
  this.last.systime = systime;
  this.last.usertime = usertime;
  // get 1 seconds worth of samples
  var max = 0;
  var samples = this.samples.filter(function(s) {
    if(s.percentage > max) {
      max = s.percentage;
    }
    return (s.at > current - 1000 * 1000); // microsecond = 1000 milliseconds, and 1000 milliseconds = 1 second
  });
  // average samples over 1 second
  this.loads['1s'] = samples.reduce(function(prev, current) { return prev + current.percentage; }, 0) / samples.length;
  this.loads['1smax'] = max;

  var max = 0;
  // get 1 seconds worth of samples
  var samples = this.samples.filter(function(s) {
    if(s.percentage > max) {
      max = s.percentage;
    }
    return (s.at > current - 5000 * 1000);
  });
  // average samples over 1 second
  this.loads['5s'] = samples.reduce(function(prev, current) { return prev + current.percentage; }, 0) / samples.length;
  this.loads['5smax'] = max;

  var max = 0;
  // get 1 seconds worth of samples
  var samples = this.samples.filter(function(s) {
    if(s.percentage > max) {
      max = s.percentage;
    }
    return (s.at > current - 10000 * 1000);
  });

  // only store up to 10 s
  this.samples = samples;

  // average samples over 1 second
  this.loads['10s'] = samples.reduce(function(prev, current) { return prev + current.percentage; }, 0) / samples.length;
  this.loads['10smax'] = max;
};

CPU.prototype.getStart = function() {
  var self = this;
  // sample at x10 per second
  setInterval(function() {
    self.loadAvg();
  }, 100);

  return proc.gettimeofday();
};

CPU.prototype.getCPU = function(start) {
  if(this.loads['5s'] > this.pegged_limit) {
    this.pegged = true;
  } else {
    this.pegged = false;
  }
  return {
    real: this.last.walltime,
    user: this.last.usertime,
    sys: this.last.systime,
    percentage: this.loads['5s'],
    load_1: this.loads['1s'],
    load_5: this.loads['5s'],
    load_10: this.loads['10s'],
    mload_1: this.loads['1smax'],
    mload_5: this.loads['5smax'],
    mload_10: this.loads['10smax']
  }
};

CPU.prototype.isPegged = function (start) {
  return this.pegged;
};

CPU.prototype.setPeggedLimit = function(limit) {
  this.pegged_limit = limit;
};


module.exports = new CPU(); ;
