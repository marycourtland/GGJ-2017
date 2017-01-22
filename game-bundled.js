(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Settings = window.Settings;
var View = require('./view')

// view-independent modules
var Context = {
}

window.game = {};

window.onload = function() {
    View.load(Context);
}

},{"./view":4}],2:[function(require,module,exports){
module.exports = AssetData = {
    //blue: {
    //    url:     'images/colors/blue2.png',
    //    anchors: [0.5, 0.5],
    //},
}

},{}],3:[function(require,module,exports){
module.exports = Data = {};

Data.scoreLevels = {
  0: 1,
  100: 2,
  250: 3,
  450: 4,
  700: 5,
  1000: 6,
  1350: 7,
  1800: 8
}

Data.levels = {
  1: {
    fallSpeed:2
  },
  2: {
    fallSpeed:2.2
  },
  3: {
    fallSpeed:2.5
  },
  4: {
    fallSpeed:2.8
  },
  5: {
    fallSpeed:3.2
  },
  6: {
    fallSpeed:3.6
  },
  7: {
    fallSpeed:4.0
  },
  8: {
    fallSpeed:4.4
  }
}

Data.dangerZones = [
  {color: 0x00ff00, radius: 100, text: ""},
  {color: 0xaaff00, radius: 150, text: "Keep an eye on this one"},
  {color: 0xff4400, radius: 200, text: "Warning: Approaching destabilization!"},
  {color: 0xff0000, radius: 250, text: "!!! DESTABILIZED !!", death: true},
]

Data.pulseTypes = {
  standard: {
    frequency: 0.8,
    params: [
      {type: 'sine', magnitude: [30, 0.5], freq: [1/6, 0.1]},
      {type: 'gaussian', spread: [300, 250], shift: [Settings.gameDims.x / 2, 0]}
    ]
  },
  easy: {
    frequency: 0.2,
    params: [
      // 4 not 2 ???????
      {type: 'sine', magnitude: [40, 0], freq: [1/30, 0], shift: [Settings.gameDims.x / 4, 0]},
      {type: 'gaussian', spread: [200, 0], shift: [Settings.gameDims.x / 4, 0]}
    ]
  }


}

},{}],4:[function(require,module,exports){
module.exports = view = {};

view.load = function(Context) {
    var GameStates = require('./states');

    window.game = new Phaser.Game(window.innerWidth, window.innerHeight, Phaser.AUTO, 'game', null, true, false);

    for (var stateName in GameStates) {
        var state = GameStates[stateName];
        if (typeof state.setContext === 'function') state.setContext(Context);
        game.state.add(stateName, state);
    }

    game.state.start('Boot');
};


},{"./states":8}],5:[function(require,module,exports){
module.exports = sound = {};


var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var masterVolume = audioCtx.createGain();
masterVolume.connect(audioCtx.destination);
masterVolume.gain.value = 1;

sound.playData = function(data, secondsInData) {
  function normalize(data) {
    var max = 0;
    data.forEach(function(d) { max = Math.max(max, Math.abs(d)); })
    return data.map(function(d) { return d / max; })
  }

  var normalizedData = normalize(data);
  var D = data.length;

  // How many audio frames per data points?
  var framesInData = audioCtx.sampleRate * secondsInData;
  var framesPerDatum = framesInData / D;

  // Adjust the time span so that framesPerDatum is an integer
  framesPerDatum -= (framesPerDatum % 1);
  framesinData = framesPerDatum * D;
  secondsInData = framesInData / audioCtx.sampleRate;80
  var totalFrames = audioCtx.sampleRate * secondsInData;

  // Output data to audio buffer

  var wavelineBuffer = audioCtx.createBuffer(2, totalFrames, audioCtx.sampleRate);

  for (var channel = 0; channel < 2; channel++) {
    var buffering = wavelineBuffer.getChannelData(channel);
    for (var i = 0; i < totalFrames; i++) {
      var _i = Math.floor(i / framesPerDatum);
      buffering[i] = normalizedData[_i];
    }
  }

  var source = audioCtx.createBufferSource();
  source.buffer = wavelineBuffer;
  source.connect(masterVolume);
  source.start();
}


},{}],6:[function(require,module,exports){
var Settings = window.Settings;
var AssetData = require('../asset_data');

var game;

module.exports = Boot = function (_game) { 
    game = _game;
};

Boot.prototype = {
    preload: function () {
        for (var sprite_id in AssetData) {
            game.load.image(sprite_id, AssetData[sprite_id].url);
        }

        game.world.setBounds(0, 0, Settings.gameDims.x, Settings.gameDims.y);
    },

    create: function() {
        console.log('Game state: Boot');
        game.state.start('Menu');
    }
}

},{"../asset_data":2}],7:[function(require,module,exports){
var game;

module.exports = End = function (_game) { 
    game = _game;
};

End.prototype = {
    create: function () {
        console.log('Game state: End');
        // Todo :)

        game.state.start('Menu');
    },
};

},{}],8:[function(require,module,exports){
module.exports = GameStates = {
    Boot: require('./boot.js'),
    Menu: require('./menu.js'),
    Play: require('./play.js'),
    End:  require('./end.js'),
}

},{"./boot.js":6,"./end.js":7,"./menu.js":9,"./play.js":10}],9:[function(require,module,exports){
var game;

module.exports = Menu = function (_game) { 
    game = _game;
};

Menu.prototype = {
    create: function () {
        console.log('Game state: Menu');
        // Todo :)

        game.state.start('Play');
    },
};

},{}],10:[function(require,module,exports){
var xy = window.XY;
var Settings = window.Settings;
var AssetData = require('../asset_data');
var Waveline = require('../waveline')
var Data = require('../data')
var Sound = require('../sound')
var game;

var Context;

var wave_y0 = 50;

module.exports = Play = function (_game) { 
    game = _game;
};

Play.setContext = function(newContext) {
    Context = newContext;
};

Play.prototype = {
    preload: function() {
    },

    create: function () {
      game.line = []

      var L = Settings.gameDims.x;
      var n = 3;
      game.waveline = new Waveline(0, Settings.gameDims.x, function(x) { return 10 * Math.sin(x*(n*2*Math.PI)/L); })
      game.waveline.moveTo(Settings.gameDims.y/2);

      // todo: what if there are too many of these? don't respawn them?
      game.inputWaveline = Play.spawnInputWaveline();

      game.inputDirection = -1;
      game.inputScale = 0;
      game.currentFallSpeed = Settings.fallSpeed;
      game.g = game.add.graphics(0,0);

      game.currentWarning = {peak: xy(0, 0), zone: Data.dangerZones[0]}

      game.score = 0;
      game.level = 1;

      // Text outputs
      game.outputs = {}
      game.outputs.score = game.add.text(Settings.gameDims.x / 2, 20, '', {fill: Settings.gameColorStr, align: 'center'})
      game.outputs.score.anchor = new Phaser.Point(0.5, 0)

      game.outputs.warning = game.add.text(0, 0, '', {fill: Settings.gameColorStr, align: 'center'})
      game.outputs.warning.anchor = new Phaser.Point(0.5, 0)
      game.outputs.warning.setStyle({font: '12pt Arial'})
    },

    update: function () {
      if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        game.inputScale += Settings.rotateScale;
        game.inputWaveline.scaleTo(Math.sin(game.inputScale));
      }

      if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        game.inputWaveline.shift(-Settings.shiftSpeed);
      }

      if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        game.inputWaveline.shift(Settings.shiftSpeed);
      }

      if (
        (game.input.keyboard.isDown(Phaser.Keyboard.DOWN) && game.inputDirection == 1)
        ||
        (game.input.keyboard.isDown(Phaser.Keyboard.UP) && game.inputDirection == -1)
      ) {
        // Move faster
        game.inputWaveline.moveBy(Settings.superFallSpeed * game.inputDirection);
      }
      else {
        game.inputWaveline.moveBy(game.currentFallSpeed * game.inputDirection);
      }


      if (
        (game.inputWaveline.y > game.waveline.y && game.inputDirection == 1)
        ||
        (game.inputWaveline.y < game.waveline.y && game.inputDirection == -1)
       ) {
        game.score += 10; // TODO: custom score per input wave
        game.inputDirection *= -1;
        game.waveline.add(game.inputWaveline);
        game.inputWaveline = Play.spawnInputWaveline();

        Sound.playData(game.waveline.getDataForAudio(), 2);

        Play.detectDangerZone();

        if (game.currentWarning.zone.death) {
          Play.death();
        }

        // Detect a level up
        var newLevel = 1;
        for (var score in Data.scoreLevels) {
          if (game.score >= score) {
            newLevel = Data.scoreLevels[score];
          }
        }
        if (newLevel !== game.level) Play.levelUp(newLevel);

      }
    },
    render: function () {
      game.g.clear();

      Play.renderDangerZones();

      game.outputs.warning.bringToTop();

      game.waveline.render(game.g);
      game.inputWaveline.render(game.g);

      // Output text
      game.outputs.score.setText('SCORE: ' + game.score);

      // Peak warning
      game.outputs.warning.setText(game.currentWarning.zone.text);
      var warning_dy = (game.currentWarning.peak.y > 0) ? 10 : -30;
      game.outputs.warning.reset(game.currentWarning.peak.x, game.currentWarning.peak.y + game.waveline.y + warning_dy);
    }
};

Play.renderDangerZones = function() {
  // Set up danger zones
  var y = 0;
  Data.dangerZones.forEach(function(zone) {
    var yPrev = y;
    y = zone.radius;

    var y0 = Settings.gameDims.y/2;
    var xmax = Settings.gameDims.x;

    game.g.beginFill(zone.color, 0.5)
    game.g.drawRect(0, y0 - y, xmax, y - yPrev);
    game.g.drawRect(0, y0 + yPrev, xmax, y - yPrev)
    game.g.endFill();
  })
}


Play.detectDangerZone = function() {
  function getZone(y) {
    return Data.dangerZones.reduce(function(current, next) {
      if (!current) return next;
      if (Math.abs(y) > current.radius && Math.abs(y) < next.radius) return next;
      return current;
    }, null)
  }
  var maxPeak = game.waveline.getMax(); 
  var zone = getZone(maxPeak.y);

  game.currentWarning = {
    peak: maxPeak,
    zone: zone
  }
}

Play.levelUp = function(newLevel) {
  game.level = newLevel;

  // Speed up the falling
  game.currentFallSpeed = Data.levels[game.level].fallSpeed;
}

function createWaveform(params) {
  var flip = Math.random() < 0.5;
  var _params = params.map(function(p) {
    var item = {};
    for (var field in p) {
      item[field] = p[field];
      if (['magnitude', 'freq', 'spread', 'shift'].indexOf(field) !== -1) {
        item[field] = p[field][0] + randFloat(p[field][1]);
      }
    }
    return item;
  })
  console.log(_params)
  return function(x) {
    var y = 1;
    var p;
    for (var i = 0; i < _params.length; i++) {
      p = _params[i];
      if ('shift' in p) {
        x -= p.shift;
      }
      if (p.type === 'sine') {
        y *= p.magnitude * Math.cos(x * p.freq);
      }
      else if (p.type === 'gaussian') {
        y *= Math.exp(-Math.pow(x, 2) / (50*p.spread));
      }
    }
    if (flip) y *= -1; // just make sure this is always flip flopping
    return y;
  }
}

Play.spawnInputWaveline = function() {
  // this is so that the wave gets computed completely (no boundary snafus) 
  // then it gets shifted to the real x0 later
  var x0_temporary = Settings.gameDims.x / 2;

  // the real x0
  var x0 = Math.floor(Math.random() * Settings.gameDims.x);

  var waveline = new Waveline(0, Settings.gameDims.x, createWaveform(chooseRandomPulse()));

  waveline.shift(x0 - x0_temporary);

  // Is it going down from the top or up from below?
  if (game.inputDirection === 1) {
    waveline.moveTo(Settings.inputStart);
  }
  else {
    waveline.moveTo(Settings.gameDims.y - Settings.inputStart);
  }
  return waveline;
}

function chooseRandomPulse() {
  var r = Math.random();
  var R = 0;
  var pulse; 
  for (var type in Data.pulseTypes) {
    R += Data.pulseTypes[type].frequency;
    if (r < R) {
      pulse = Data.pulseTypes[type].params;
      break;
    }
  }
  return pulse;
}

Play.death = function() {
  //game.outputs.death.setText('Death!')
  game.state.start('End')
}

function randFloat(a, b) {
  if (typeof b === 'undefined') {
    b = a; a = -b;
  }
  return Math.random() * (b-a) + a;
}

},{"../asset_data":2,"../data":3,"../sound":5,"../waveline":11}],11:[function(require,module,exports){
var xy = window.XY;
var Settings = window.Settings;

module.exports = Waveline = function(x0, xmax, waveform) {
  this.range = [x0, xmax];
  this.points = [];
  this.lines = [];
  this.scale = 1;
  this.y = 0;

  // TODO: fill in the rest of the X values from the game bounds
  
  for (var x = x0; x < xmax; x += Settings.dx) {
    var p = xy(x, waveform(x))
    this.points.push(p);
    if (x !== x0) {
      this.lines.push(new Phaser.Line(0, 0, 0, 0)); // this will be rendered later
    }
  }
  this.update();
}

Waveline.prototype = {};

Waveline.prototype.getMax = function() {
  return this.points.reduce(function(current, next) {
    if (!current) return next;
    if (Math.abs(next.y) > Math.abs(current.y)) return next;
    return current;
  }, null)

}
Waveline.prototype.scaleBy = function(mag) {
  this.scale *= mag; 
  this.update();
}
Waveline.prototype.scaleTo = function(mag) {
  this.scale = mag;
  this.update();
}
Waveline.prototype.moveTo = function(y) {
  this.y = y;
  this.update();
}
Waveline.prototype.moveBy = function(y) {
  this.y += y;
  this.update();
}
Waveline.prototype.shift = function(n) {
  var pts = this.points;
  for (var i = 0; i < Math.abs(n); i++) {
    if (n < 0) {
      // rotating leftwards
      var p = pts.splice(0, 1)[0];
      pts.push(p);
    }
    else {
      // rotating rightwards
      var p = pts.splice(pts.length-1, pts.length)[0]
      pts.splice(0, 0, p)
    }
  }
  // relabel the x values
  var i = 0;
  for (var x = this.range[0]; x < this.range[1]; x += Settings.dx) {
    this.points[i].x = x;
    i += 1;
  }

  this.update();
}
Waveline.prototype.add = function(waveline2) {
  // ASSUMES THE POINTS LINE UP CORRECTLY...
  for (var i = 0; i < this.points.length; i++) {
    this.points[i].y += waveline2.points[i].y * waveline2.scale;
  }
  this.update();
}
Waveline.prototype.update = function() {
  var self = this;
  renderedPoints = this.points.map(function(p) {
    return xy(p.x, p.y * self.scale + self.y);
  })

  var p0 = renderedPoints[0];
  for (var i = 1; i < renderedPoints.length-1; i++) {
    var p = renderedPoints[i];
    this.lines[i].setTo(p0.x, p0.y, p.x, p.y)
    p0 = p;
  }
}
Waveline.prototype.render = function(g) {
  var self = this;
  renderedPoints = this.points.map(function(p) {
    return xy(p.x, p.y * self.scale + self.y);
  })

  var p0 = renderedPoints[0];
  g.lineStyle(4, Settings.gameColor, 1);
  g.moveTo(p0.x, p0.y)
  for (var i = 1; i < renderedPoints.length; i++) {
    var p = renderedPoints[i];
    g.lineTo(p.x, p.y)
  }
}

Waveline.prototype.getDataForAudio = function() {
  return this.points.map(function(p) { return p.y });
}

},{}]},{},[1]);
