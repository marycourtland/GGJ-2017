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
