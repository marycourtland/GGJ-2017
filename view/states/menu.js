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
