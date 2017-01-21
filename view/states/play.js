var xy = window.XY;
var Settings = window.Settings;
var AssetData = require('../asset_data');
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
      game.waveline.moveTo(Settings.gameDims.y - 100);

      // todo: what if there are too many of these? don't respawn them?
      game.inputWaveline = spawnInputWaveline();

      game.inputScale = 0;
      game.g = game.add.graphics(0,0);
    },

    update: function () {
      if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        game.inputScale += 1/50;
        game.inputWaveline.scaleTo(Math.sin(game.inputScale));
      }

      if (game.input.keyboard.isDown(Phaser.Keyboard.LEFT)) {
        game.inputWaveline.shift(-1);
      }

      if (game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)) {
        game.inputWaveline.shift(1);
      }

      if (game.input.keyboard.isDown(Phaser.Keyboard.DOWN)) {
        // Move faster
        game.inputWaveline.moveBy(8);
      }
      else {
        game.inputWaveline.moveBy(2);
      }


      if (game.inputWaveline.y > game.waveline.y) {
        game.waveline.add(game.inputWaveline);
        game.inputWaveline = spawnInputWaveline();
      }
    },
    render: function () {
      game.g.clear();
      game.waveline.render(game.g);
      game.inputWaveline.render(game.g);
    }
};

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

  waveline.moveTo(100);
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
  this.y +=y;
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
  //this.lines.forEach(function(line) { game.debug.geom(line); })
  var self = this;
  renderedPoints = this.points.map(function(p) {
    return xy(p.x, p.y * self.scale + self.y);
  })

  var p0 = renderedPoints[0];
  g.lineStyle(4, 0x0011cc, 1);
  g.moveTo(p0.x, p0.y)
  for (var i = 1; i < renderedPoints.length; i++) {
    var p = renderedPoints[i];
    g.lineTo(p.x, p.y)
  }
}
