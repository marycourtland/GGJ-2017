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

