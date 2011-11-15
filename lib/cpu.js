// CPU time helper
var proc = require('getrusage');

var CPU = function() {
  var self = this;
  this.pegged_limit = 80;
  this.pegged = false;
  this.lastCPU = 0;
  this.loads = {};
  this.last = {};
  this.samples = [];
  // sample at x2 per second
  setInterval(function() {
    self.loadAvg();
  }, 500);
};

// to calculate load average:
// 1) take samples
// 2) fetch samples within the last (1 / 5 / 10 seconds)
// 3) calculate the average of those samples
CPU.prototype.loadAvg = function() {
  var self = this;
  this.last.walltime = proc.gettimeofday();
  this.last.systime = proc.getsystime();
  this.last.usertime = proc.getusertime();
  // add a single sample
  var o = {
    at: this.last.walltime,
    walltime: this.last.walltime,
    systime: this.last.systime,
    usertime: this.last.usertime,
  };
  this.samples.push(o);

  // collect the min and max times over 1, 5 and 10 s
  var diffs = { '1s': { max: o, min: o }, '5s': { max: o, min: o }, '10s': { max: o, min: o } };
  // get samples
  this.samples = this.samples.filter(function(s) {
    // microsecond = 1000 milliseconds, and 1000 milliseconds = 1 second
    if(s.at > self.last.walltime - 1000 * 1000) {
      // only min can change, since samples are from the past
      if( s.at < diffs['1s'].min.at ) {
        diffs['1s'].min = s;
      }
    }
    if(s.at > self.last.walltime - 5000 * 1000) {
      // only min can change, since samples are from the past
      if( s.at < diffs['5s'].min.at ) {
        diffs['5s'].min = s;
      }
    }
    if(s.at > self.last.walltime - 10000 * 1000) {
      // only min can change, since samples are from the past
      if( s.at < diffs['10s'].min.at ) {
        diffs['10s'].min = s;
      }
    }
    // remove values older than 10 s
    return (s.at > self.last.walltime - 10000 * 1000);
  });

  // get 1 seconds worth of samples
  var result = this.calcUsage(diffs['1s'].min, diffs['1s'].max);
  this.loads['1s'] = result.percentage;

  result = this.calcUsage(diffs['5s'].min, diffs['5s'].max);
  this.loads['5s'] = result.percentage;

  result = this.calcUsage(diffs['10s'].min, diffs['10s'].max);
  this.loads['10s'] = result.percentage;

};

CPU.prototype.calcUsage = function (min, max) {
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

CPU.prototype.getCPU = function() {
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
    load_10: this.loads['10s']
  }
};

CPU.prototype.isPegged = function (start) {
  return this.pegged;
};

CPU.prototype.setPeggedLimit = function(limit) {
  this.pegged_limit = limit;
};


module.exports = new CPU(); ;
