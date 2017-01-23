
module.exports = function createWaveform(params) {
  var flip = Math.random() < 0.5;
  var _params = params.map(function(p) {
    var item = {};
    for (var field in p) {
      item[field] = p[field];
      if (['magnitude', 'freq', 'spread'].indexOf(field) !== -1) {
        item[field] = p[field][0] + randFloat(p[field][1]);
      }
    }
    return item;
  })

  return function(x) {
    // recenter to here
    x -= Settings.gameDims.x / 2;
    
    var y = 1;
    var p;
    for (var i = 0; i < _params.length; i++) {
      p = _params[i];
      if ('shift' in p) {
        x -= p.shift;
      }
      if (p.type === 'sine') {
        y *= p.magnitude * Math.cos(x * 2 * Math.PI * p.freq);
      }
      else if (p.type === 'gaussian') {
        y *= Math.exp(-Math.pow(x, 2) / (50*p.spread));
      }
    }
    if (flip) y *= -1; // just make sure this is always flip flopping
    return y;
  }
}


function randFloat(a, b) {
  if (typeof b === 'undefined') {
      b = a; a = -b;
    }
  return Math.random() * (b-a) + a;
}
