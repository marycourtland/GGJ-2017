var xy = window.XY;
var Settings = window.Settings;
var AssetData = require('../asset_data');
var game;

var Context;

var wave_y0 = 50;
var gameColor= 0x0011cc;
var gameColorStr = '#0011cc';

var dangerZones = [
  {color: 0x00ff00, radius: 100, text: ""},
  {color: 0xaaff00, radius: 150, text: "Keep an eye on this one"},
  {color: 0xff4400, radius: 200, text: "Warning: Approaching destabilization!"},
  {color: 0xff0000, radius: 250, text: "!!! DESTABILIZED !!", death: true},
]

var scoreLevels = {
  0: 1,
  100: 2,
  250: 3,
  450: 4,
  700: 5,
  1000: 6,
  1350: 7,
  1800: 8
}

var levels = {
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
      game.inputWaveline = spawnInputWaveline();

      game.inputDirection = -1;
      game.inputScale = 0;
      game.currentFallSpeed = Settings.fallSpeed;
      game.g = game.add.graphics(0,0);

      game.currentWarning = {peak: xy(0, 0), zone: dangerZones[0]}

      game.score = 0;
      game.level = 1;

      // Text outputs
      game.outputs = {}
      game.outputs.score = game.add.text(Settings.gameDims.x / 2, 20, '', {fill: gameColorStr, align: 'center'})
      game.outputs.score.anchor = new Phaser.Point(0.5, 0)

      game.outputs.warning = game.add.text(0, 0, '', {fill: gameColorStr, align: 'center'})
      game.outputs.warning.anchor = new Phaser.Point(0.5, 0)
      game.outputs.warning.setStyle({font: '12pt Arial'})
    },

    update: function () {
      if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        game.inputScale += Settins.rotateScale;
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
        game.inputWaveline = spawnInputWaveline();

        detectDangerZone();

        if (game.currentWarning.zone.death) {
          death();
        }

        // Detect a level up
        var newLevel = 1;
        for (var score in scoreLevels) {
          if (game.score >= score) {
            newLevel = scoreLevels[score];
          }
        }
        if (newLevel !== game.level) levelUp(newLevel);

      }
    },
    render: function () {
      game.g.clear();

      renderDangerZones();

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

function renderDangerZones() {
  // Set up danger zones
  var y = 0;
  dangerZones.forEach(function(zone) {
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


function detectDangerZone() {
  function getZone(y) {
    return dangerZones.reduce(function(current, next) {
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

function levelUp(newLevel) {
  game.level = newLevel;

  // Speed up the falling
  game.currentFallSpeed = levels[game.level].fallSpeed;
}

function spawnInputWaveline() {
  // base wave
  var magnitude = 30 * randFloat(-5, 5);
  var freq = (1/6) + randFloat(-0.1, 0.1);

  // envelope
  var x0 = Math.floor(Math.random() * Settings.gameDims.x);
  var spread = 300 + randFloat(-250, 250)

  // this is so that the wave gets computed completely (no boundary snafus) 
  // then it gets shifted to the real x0 later
  var x0_temporary = Settings.gameDims.x / 2;

  var waveline = new Waveline(0, Settings.gameDims.x, function(x) {
    return 30 * Math.sin(x * freq) *  Math.exp(-Math.pow(x-x0_temporary, 2)/(50 * spread))
  })
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

function randFloat(a, b) {
  if (typeof b === 'undefined') {
    b = a; a = 0;
  }
  return Math.random() * (b-a) + a;
}

function Waveline(x0, xmax, waveform) {
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
  g.lineStyle(4, gameColor, 1);
  g.moveTo(p0.x, p0.y)
  for (var i = 1; i < renderedPoints.length; i++) {
    var p = renderedPoints[i];
    g.lineTo(p.x, p.y)
  }
}

window.death = function() {
  //game.outputs.death.setText('Death!')
  game.state.start('End')

}
