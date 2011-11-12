
var Cpu = function() {


};

var clients = [];
var results = [];
var current = 0;
var done = 0;



// we only calculate CPU time over the current interval
var cpu = [];
var usage = proc.usage();
// store the current gettimeofday in microseconds
var prev_total = usage.systime + usage.usertime;
var prev = proc.gettimeofday();
var start = prev;

//
function getCPU() {
  var usage = proc.usage();
  var current = proc.gettimeofday();
  // total cpu time
  var total = usage.systime + usage.usertime;
  var elapsed_cpu = total - prev_total;
  var elapsed_wall = current - prev;

  console.log('CPU usage since last tick: ', (elapsed_cpu / elapsed_wall) * 100, '%' );
  console.log('CPU usage total: ', (total / (current - start)) * 100, '%');
  console.log(usage);
  prev_total = total;
  prev = current;
}

setInterval(getCPU, 1000);

module.exports = Cpu;
