function series(callbacks, last) {
  var results = [];
  function next() {
    var callback = callbacks.shift();
    if(callback) {
      callback(function() {
        results.push(Array.prototype.slice.call(arguments));
        next();
      });
    } else {
      last && last(results);
    }
  }
  next();
}

module.exports = series;
