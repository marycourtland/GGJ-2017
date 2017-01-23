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
