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
