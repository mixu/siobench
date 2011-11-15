var cpu = require('../lib/cpu.js');

var start = cpu.getStart(); // start time

exports['CPU should not be pegged when workload is low'] = function(test) {
  setTimeout(function() {
    test.ok(!cpu.isPegged(start));
    test.done();
  }, 500);
};

exports['doing something CPU intensive should trigger the CPU pegged state'] = function(test) {
  cpu.setPeggedLimit(40);
  var crypto = require('crypto');

  function randomStr(length) {
    var random = [];
    for(var i = 0; i < length; i ++) {
      //random.push(Math.floor(Math.random() * 65365 )); // Maximum legal input for fromCharCode
      // seems to be that single quotes (39) or some other < 40 character messes with Node's HTTP client
      var rnd = Math.floor( 40 + Math.random() * (255-40) );
      while(rnd == 10 || rnd == 13 || rnd == 0) {
        rnd = Math.floor(Math.random() * 255 );
      }
      random.push(rnd); // Maximum legal input for fromCharCode
    }
    return String.fromCharCode.apply(String, random);
  };

  function doSomething() {
    var j = 0;
    console.log('dosomething');
    for( var i = 0; i < 1000; i++) {
      crypto.createHash('sha1').update(randomStr(10000)).digest('hex');
    }
  }

  var interval = setInterval(doSomething, 10);

  setTimeout(function() {
    clearInterval(interval);
    test.ok(cpu.isPegged(start));
    test.done();
  }, 5000);
};


// if this module is the script being run, then run the tests:
if (module == require.main) {
  var nodeunit_runner = require('nodeunit-runner');
  nodeunit_runner.run(__filename);
}
