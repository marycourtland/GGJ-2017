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

// Prevent all scrolling
window.addEventListener("keydown", function(e) {
    // space, page up, page down and arrow keys:
    if([32, 33, 34, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);

},{"./view":5}],2:[function(require,module,exports){
module.exports = AssetData = {
    //blue: {
    //    url:     'images/colors/blue2.png',
    //    anchors: [0.5, 0.5],
    //},
}

},{}],3:[function(require,module,exports){

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

},{}],4:[function(require,module,exports){
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
    fallSpeed:2,
  },
  2: {
    fallSpeed:2.2,
  },
  3: {
    fallSpeed:2.5,
  },
  4: {
    fallSpeed:2.8,
  },
  5: {
    fallSpeed:3.2,
  },
  6: {
    fallSpeed:3.6,
  },
  7: {
    fallSpeed:4.0,
  },
  8: {
    fallSpeed:4.4,
  }
}
var totalLevels = Object.keys(Data.levels).length;

for (var l in Data.levels) {
  Data.levels[l].fallSpeed -= 0.5;
}


// Increase sound by a half step each level

Data.levels[1].soundFrequency = 1/150;
var halfstep = 1.05946;
for (var l = 2; l < totalLevels; l++ ) {
  Data.levels[l].soundFrequency = Data.levels[l-1].soundFrequency * halfstep;
}

Data.dangerZones = [
  {color: 0x00ff00, radius: 120, text: ""},
  {color: 0xaaff00, radius: 180, text: "Keep an ear on this one"},
  {color: 0xff4400, radius: 220, text: "Warning: Approaching Sound Limit!"},
  {color: 0xff0000, radius: 250, text: "!!! SUPER LOUD !!!", death: true},
]

Data.pulseTypes = {
  standard: {
    frequency: 0.1,
    params: [
      {type: 'sine', magnitude: [30, 0.5], freq: [1/20, 0.01]},
      {type: 'gaussian', spread: [100, 50]}
    ]
  },
  easy: {
    frequency: 0.9,
    params: [
      // 4 not 2 ???????
      {type: 'sine', magnitude: [50, 20], freq: [1/400, 0.01]},
      {type: 'gaussian', spread: [400, 100]}
    ]
  }


}

},{}],5:[function(require,module,exports){
module.exports = view = {};

view.load = function(Context) {
    var GameStates = require('./states');

    window.game = new Phaser.Game(Settings.gameDims.x, Settings.gameDims.y, Phaser.AUTO, 'game', null, true, false);

    for (var stateName in GameStates) {
        var state = GameStates[stateName];
        if (typeof state.setContext === 'function') state.setContext(Context);
        game.state.add(stateName, state);
    }

    game.state.start('Boot');
};


},{"./states":10}],6:[function(require,module,exports){
var Data = require('./data');

module.exports = renderDangerZones = function(g) {
  // Set up danger zones
  var y = 0;
  Data.dangerZones.forEach(function(zone) {
    var yPrev = y;
    y = zone.radius;

    var y0 = Settings.gameDims.y/2;
    var xmax = Settings.gameDims.x;

    g.beginFill(zone.color, 0.5)
    g.drawRect(0, y0 - y, xmax, y - yPrev);
    g.drawRect(0, y0 + yPrev, xmax, y - yPrev)
    g.endFill();
  })  
}


},{"./data":4}],7:[function(require,module,exports){
var xy = window.XY;
var createWaveform = require('./createwaveform');
module.exports = sound = {};

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var masterVolume = audioCtx.createGain();
masterVolume.connect(audioCtx.destination);
masterVolume.gain.value = 0.5;


sound.masterWaveform = [
  {type: 'sine', magnitude: [1, 0], freq: [1/150, 0]},
];

sound.setMasterFrequency = function(f) {
  this.masterWaveform[0].freq[0] = f;
}

sound.playData = function(data, secondsInData) {
  function normalize(data) {
    var max = 0;
    data.forEach(function(d) { max = Math.max(max, Math.abs(d)); })
    return data.map(function(d) { return d / max; })
  }

  function downsample(data, framesPerDatum, shouldInterpolate) {
    var output = [];
    var D = data.length;
    for (var i = 0; i < framesPerDatum * D; i++) {
      var _i = Math.floor(i / framesPerDatum);

      if (shouldInterpolate) {
        var di = i % framesPerDatum;
        var p1 = xy(_i, data[_i]);
        var p2 = xy(_i + 1, data[_i + 1]);
        var x = _i + di / framesPerDatum; 
        var next = interpolate(x, p1, p2).y
      }

      output.push(next);
    }
    return output;
  }

  var normalizedData = normalize(data);
  var D = data.length;

  // How many audio frames per data points?
  var framesInData = audioCtx.sampleRate * secondsInData;
  var framesPerDatum = framesInData / D;

  // Adjust the time span so that framesPerDatum is an integer
  framesPerDatum -= (framesPerDatum % 1);
  framesinData = framesPerDatum * D;
  secondsInData = framesInData / audioCtx.sampleRate;
  var totalFrames = audioCtx.sampleRate * secondsInData;

  var downsampled = downsample(normalizedData, framesPerDatum, true);
  var outputData = [];
  var waveform = createWaveform(sound.masterWaveform);
  for (var i = 0; i < downsampled.length; i++) {
    outputData.push(downsampled[i] * waveform(i));
  }
  

  // Output data to audio buffer
  var wavelineBuffer = audioCtx.createBuffer(2, totalFrames, audioCtx.sampleRate);

  for (var channel = 0; channel < 2; channel++) {
    var buffering = wavelineBuffer.getChannelData(channel);
    for (var i = 0; i < totalFrames; i++) {
      var _i = Math.floor(i / framesPerDatum);
      //buffering[i] = normalizedData[_i];
      buffering[i] = outputData[i];
    }
  }

  var source = audioCtx.createBufferSource();
  source.buffer = wavelineBuffer;
  source.connect(masterVolume);
  source.start();
}

interpolate = function(x, p1, p2) { // Linear
  if (!p1) { return xy(p2.x, p2.y); }
  if (!p2) { return xy(p1.x, p1.y); }
  if (p1.x === p2.x) { return xy(p1.x, p2.y); }

  var f = (x - p1.x) / (p2.x - p1.x);
  return xy(x, p1.y + f*(p2.y - p1.y));
}

},{"./createwaveform":3}],8:[function(require,module,exports){
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

},{"../asset_data":2}],9:[function(require,module,exports){
var game;
var renderDangerZones = require('../renderdangerzones');

module.exports = End = function (_game) { 
    game = _game;
};

End.prototype = { 
    create: function () {
      console.log('Game state: End');
      this.g = game.add.graphics(0,0);

      this.outputs = {};
      var lines = [
        'well done!',
        'you reached level ' + game.level,
        'score: ' + game.score,
        '',
        'spacebar to replay'
      ];
      this.outputs.info = game.add.text(Settings.gameDims.x / 2, Settings.gameDims.y / 2, lines.join('\n'), {
        fill: Settings.gameColorStr,
        align: 'center',
        fontSize: 30,
      })
      this.outputs.info.alpha = 0.8;
      this.outputs.info.anchor = new Phaser.Point(0.5, 0.5)
    },

    update: function() {
      if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        game.score = 0;
        game.level = 1;
        game.state.start('Menu');
      } 
    },

    render: function() {
      this.g.clear();
      renderDangerZones(this.g);
    } 
};

},{"../renderdangerzones":6}],10:[function(require,module,exports){
module.exports = GameStates = {
    Boot: require('./boot.js'),
    Menu: require('./menu.js'),
    Play: require('./play.js'),
    End:  require('./end.js'),
}

},{"./boot.js":8,"./end.js":9,"./menu.js":11,"./play.js":12}],11:[function(require,module,exports){
var game;

var renderDangerZones = require('../renderdangerzones');

module.exports = Menu = function (_game) { 
    game = _game;
};

Menu.prototype = {
    create: function () {
      console.log('Game state: Menu');
      this.g = game.add.graphics(0,0);
    
      this.outputs = {};
      var lines = [
        'NOISE TETRIS',
        '',
        'move with arrow keys',
        'try to cancel waves out.',
        "don't get too loud!",
        '',
        'spacebar to start'
      ];
      this.outputs.info = game.add.text(Settings.gameDims.x / 2, Settings.gameDims.y / 2, lines.join('\n'), {
        fill: Settings.gameColorStr,
        align: 'center',
        fontSize: 20,
      })
      this.outputs.info.alpha = 0.8;
      this.outputs.info.anchor = new Phaser.Point(0.5, 0.5)
    },

    update: function() {
      if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        game.score = 0;
        game.state.start('Play');
      } 
    
    },

    render: function() {
      this.g.clear();
      renderDangerZones(this.g);
    }
};

},{"../renderdangerzones":6}],12:[function(require,module,exports){
var xy = window.XY;
var Settings = window.Settings;
var AssetData = require('../asset_data');
var Waveline = require('../waveline')
var Data = require('../data')
var Sound = require('../sound')
var createWaveform = require('../createwaveform')
var renderDangerZones = require('../renderdangerzones')
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
      Play.paused = false;
      game.score = 0;
      game.level = 1;

      var L = Settings.gameDims.x;
      var n = 3;
      var shift = L/2;
      Play.waveline = new Waveline(0, Settings.gameDims.x, function(x) { return 10 * Math.sin((x-shift)*(n*2*Math.PI)/L); }, shift)
      Play.waveline.moveTo(Settings.gameDims.y/2);

      Play.inputWaveline = Play.spawnInputWaveline();

      Play.inputDirection = -1;
      Play.inputScale = 0;
      Play.currentFallSpeed = Data.levels[game.level].fallSpeed;
      Play.g = game.add.graphics(0,0);

      Play.currentWarning = {peak: xy(0, 0), zone: Data.dangerZones[0]}


      // Text outputs
      Play.outputs = {}
      Play.outputs.score = game.add.text(Settings.gameDims.x / 2, 20, '', {fill: 'black', align: 'center'})
      Play.outputs.score.anchor = new Phaser.Point(0.5, 0)

      Play.outputs.warning = game.add.text(0, 0, '', {fill: Settings.gameColorStr, align: 'center'})
      Play.outputs.warning.anchor = new Phaser.Point(0.5, 0)
      Play.outputs.warning.setStyle({font: '12pt Arial'})

      Play.outputs.levelup = game.add.text(Settings.gameDims.x / 2, Settings.gameDims.y / 2, 'level up', {
        fill: Settings.gameColorStr,
        align: 'center',
        fontSize: 200, 
      })
      Play.outputs.levelup.alpha = 0;
      Play.outputs.levelup.anchor = new Phaser.Point(0.5, 0.5)

      Play.outputs.death = game.add.text(Settings.gameDims.x / 2, Settings.gameDims.y / 2, 'volume\noverload', {
        fill: Settings.gameColorStr,
        align: 'center',
        fontSize: 200, 
      })
      Play.outputs.death.alpha = 0;
      Play.outputs.death.anchor = new Phaser.Point(0.5, 0.5)

      Play.shiftCooldown = 0;
    },

    update: function () {
      
      if (Play.paused) return;

      // turny input thing (todo: remove??)
      if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        Play.inputScale += Settings.rotateScale;
        Play.inputWaveline.scaleTo(Math.sin(Play.inputScale));
      }

      // ========================================= MOVING LEFT AND RIGHT 
      Play.shiftCooldown = Math.max(Play.shiftCooldown - 1, 0);

      var leftDown = game.input.keyboard.isDown(Phaser.Keyboard.LEFT);
      var rightDown = game.input.keyboard.isDown(Phaser.Keyboard.RIGHT);

      if (leftDown || rightDown) {
        if (Play.shiftCooldown === 0) {
          var shift = 0;
          if (leftDown) shift -= Settings.cell;
          if (rightDown) shift += Settings.cell;
          Play.inputWaveline.shift(shift);
          Play.shiftCooldown = Settings.shiftCooldown;
        }
      }
      else {
        Play.shiftCooldown = 0;
      }

      // ========================================= TETRIS STYLE FAST-FORWARD 
      if (
        (game.input.keyboard.isDown(Phaser.Keyboard.DOWN) && Play.inputDirection == 1)
        ||
        (game.input.keyboard.isDown(Phaser.Keyboard.UP) && Play.inputDirection == -1)
      ) {
        // Move faster
        Play.inputWaveline.moveBy(Settings.superFallSpeed * Play.inputDirection);
      }
      else {
        Play.inputWaveline.moveBy(Play.currentFallSpeed * Play.inputDirection);
      }


      // ========================================= WHEN THE WAVELINE IS READY TO MERGE 
      if (
        (Play.inputWaveline.y > Play.waveline.y && Play.inputDirection == 1)
        ||
        (Play.inputWaveline.y < Play.waveline.y && Play.inputDirection == -1)
       ) {
        game.score += 10; // TODO: custom score per input wave
        Play.inputDirection *= -1;
        Play.waveline.add(Play.inputWaveline);
        Play.inputWaveline = Play.spawnInputWaveline();

        Sound.playData(Play.waveline.getDataForAudio(), 2);

        Play.detectDangerZone();

        if (Play.currentWarning.zone.death) {
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
      Play.g.clear();

      Play.renderDangerZones();
      // MASTER WAVE 
      var widths = [
        /*
        {w: 20, a: 0.02},
        {w: 18, a: 0.02},
        {w: 16, a: 0.02},
        {w: 14, a: 0.02},
        {w: 12, a: 0.02},
        {w: 10, a: 0.1},
        {w: 6, a: 0.1},
        {w: 5, a: 0.2},
        {w: 4, a: 0.3},
        */
        {w: 3, a: 1},
      ]
      widths.forEach(function(item) {
        Play.g.lineStyle(item.w, Settings.gameColor, item.a)
        Play.waveline.render(Play.g);
      })

      if (!Play.paused) {
        Play.outputs.warning.bringToTop();


        // INPUT WAVE
        Play.g.lineStyle(3, Settings.gameColor, 1);
        Play.inputWaveline.render(Play.g);

        // Guide
        var r = Data.dangerZones[Data.dangerZones.length - 1].radius;
        Play.g.lineStyle(1, Settings.gameColor, 1);
        Play.g.moveTo(Play.inputWaveline.center, Settings.gameDims.y/2 - r);
        Play.g.lineTo(Play.inputWaveline.center, Settings.gameDims.y/2 + r);
      }

      // Output text
      Play.outputs.score.setText('SCORE: ' + game.score);

      // Peak warning
      Play.outputs.warning.setText(Play.currentWarning.zone.text);
      var warning_dy = (Play.currentWarning.peak.y > 0) ? 10 : -30;
      Play.outputs.warning.reset(Play.currentWarning.peak.x, Play.currentWarning.peak.y + Play.waveline.y + warning_dy);

      // Fade texts
      for (var t in Play.outputs) {
        fadeText(Play.outputs[t])
      }
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

    Play.g.beginFill(zone.color, 0.5)
    Play.g.drawRect(0, y0 - y, xmax, y - yPrev);
    Play.g.drawRect(0, y0 + yPrev, xmax, y - yPrev)
    Play.g.endFill();
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
  var maxPeak = Play.waveline.getMax(); 
  var zone = getZone(maxPeak.y);

  Play.currentWarning = {
    peak: maxPeak,
    zone: zone
  }
}

Play.levelUp = function(newLevel) {
  game.level = newLevel;

  // Speed up the falling
  Play.currentFallSpeed = Data.levels[game.level].fallSpeed;

  // Up the sound frequency a bit
  Sound.setMasterFrequency(Data.levels[game.level].soundFrequency);

  startTextFade(Play.outputs.levelup, 100, 0.6)
}

Play.spawnInputWaveline = function() {
  // this is so that the wave gets computed completely (no boundary snafus) 
  // then it gets shifted to the real x0 later
  var x0_temporary = Settings.gameDims.x / 2;

  // the real x0
  var x0 = Math.floor(Math.random() * Settings.gameDims.x);

  // discretize it
  x0 = x0 - (x0 % Settings.cell);

  var waveline = new Waveline(0, Settings.gameDims.x, createWaveform(chooseRandomPulse()), x0_temporary);

  waveline.shift(x0 - x0_temporary);
  waveline.center = x0; // sanity check :(

  // Is it going down from the top or up from below?
  if (Play.inputDirection === 1) {
    waveline.moveTo(Settings.inputStart);
  }
  else {
    waveline.moveTo(Settings.gameDims.y - Settings.inputStart);
  }
  return waveline;
}

Play.death = function() {
  startTextFade(Play.outputs.death, 100, 0.6);
  Play.paused = true;
  setTimeout(function() {
    game.state.start('End')
  }, 4000)
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

function startTextFade(text, lifetime, initialAlpha) {
  text.alpha = initialAlpha || 1;
  text.fadeLifetime = lifetime;
  text.fadeIncrement = text.alpha / lifetime; // linear tweening
}

function fadeText(text) {
  if (!text.fadeLifetime) return;
  text.alpha -= text.fadeIncrement;
  if (text.alpha < 0) {
    // Stop the fading
    text.alpha = 0;
    delete text.fadeLifetime;
    delete text.fadeIncrement;;
  }


}

},{"../asset_data":2,"../createwaveform":3,"../data":4,"../renderdangerzones":6,"../sound":7,"../waveline":13}],13:[function(require,module,exports){
var xy = window.XY;
var Settings = window.Settings;

module.exports = Waveline = function(x0, xmax, waveform, center) {
  this.range = [x0, xmax];
  this.points = [];
  this.lines = [];
  this.scale = 1;
  this.y = 0;
  this.center = x0 + center % (xmax - x0);

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
  this.center += (n * Settings.dx);
  this.center = this.range[0] + (this.center - this.range[0]) % (this.range[1] - this.range[0]);

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
