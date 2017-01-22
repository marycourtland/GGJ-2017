var xy = window.XY;
var Settings = window.Settings;
var AssetData = require('../asset_data');
var Waveline = require('../waveline')
var Data = require('../data')
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

      game.waveline = new Waveline(0, Settings.gameDims.x, function(x) { return 10 * Math.sin(x/50); })
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

  //waveline.shift(x0 - x0_temporary);

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
