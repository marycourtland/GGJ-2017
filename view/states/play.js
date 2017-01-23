var xy = window.XY;
var Settings = window.Settings;
var AssetData = require('../asset_data');
var Waveline = require('../waveline')
var Data = require('../data')
var Sound = require('../sound')
var createWaveform = require('../createwaveform')
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
      game.score = 0;
      game.level = 1;

      game.line = []

      var L = Settings.gameDims.x;
      var n = 3;
      var shift = L/2;
      Play.waveline = new Waveline(0, Settings.gameDims.x, function(x) { return 10 * Math.sin((x-shift)*(n*2*Math.PI)/L); }, shift)
      Play.waveline.moveTo(Settings.gameDims.y/2);

      // todo: what if there are too many of these? don't respawn them?
      Play.inputWaveline = Play.spawnInputWaveline();

      game.inputDirection = -1;
      game.inputScale = 0;
      game.currentFallSpeed = Data.levels[game.level].fallSpeed;
      game.g = game.add.graphics(0,0);

      game.currentWarning = {peak: xy(0, 0), zone: Data.dangerZones[0]}


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

      Play.shiftCooldown = 0;
    },

    update: function () {
      // turny input thing (todo: remove??)
      if (game.input.keyboard.isDown(Phaser.Keyboard.SPACEBAR)) {
        game.inputScale += Settings.rotateScale;
        Play.inputWaveline.scaleTo(Math.sin(game.inputScale));
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
        (game.input.keyboard.isDown(Phaser.Keyboard.DOWN) && game.inputDirection == 1)
        ||
        (game.input.keyboard.isDown(Phaser.Keyboard.UP) && game.inputDirection == -1)
      ) {
        // Move faster
        Play.inputWaveline.moveBy(Settings.superFallSpeed * game.inputDirection);
      }
      else {
        Play.inputWaveline.moveBy(game.currentFallSpeed * game.inputDirection);
      }


      // ========================================= WHEN THE WAVELINE IS READY TO MERGE 
      if (
        (Play.inputWaveline.y > Play.waveline.y && game.inputDirection == 1)
        ||
        (Play.inputWaveline.y < Play.waveline.y && game.inputDirection == -1)
       ) {
        game.score += 10; // TODO: custom score per input wave
        game.inputDirection *= -1;
        Play.waveline.add(Play.inputWaveline);
        Play.inputWaveline = Play.spawnInputWaveline();

        Sound.playData(Play.waveline.getDataForAudio(), 2);

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

      Play.outputs.warning.bringToTop();

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
        game.g.lineStyle(item.w, Settings.gameColor, item.a)
        Play.waveline.render(game.g);
      })

      // INPUT WAVE
      game.g.lineStyle(3, Settings.gameColor, 1);
      Play.inputWaveline.render(game.g);

      // Guide
      var r = Data.dangerZones[Data.dangerZones.length - 1].radius;
      game.g.lineStyle(1, Settings.gameColor, 1);
      game.g.moveTo(Play.inputWaveline.center, Settings.gameDims.y/2 - r);
      game.g.lineTo(Play.inputWaveline.center, Settings.gameDims.y/2 + r);

      // Output text
      Play.outputs.score.setText('SCORE: ' + game.score);

      // Peak warning
      Play.outputs.warning.setText(game.currentWarning.zone.text);
      var warning_dy = (game.currentWarning.peak.y > 0) ? 10 : -30;
      Play.outputs.warning.reset(game.currentWarning.peak.x, game.currentWarning.peak.y + Play.waveline.y + warning_dy);
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
  var maxPeak = Play.waveline.getMax(); 
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

  // Up the sound frequency a bit
  Sound.setMasterFrequency(Data.levels[game.level].soundFrequency);
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
  if (game.inputDirection === 1) {
    waveline.moveTo(Settings.inputStart);
  }
  else {
    waveline.moveTo(Settings.gameDims.y - Settings.inputStart);
  }
  return waveline;
}

Play.death = function() {
  //Play.outputs.death.setText('Death!')
  game.state.start('End')
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
