var game;

module.exports = End = function (_game) { 
    game = _game;
};

End.prototype = {
    create: function () {
        console.log('Game state: End');
        // Todo :)

        game.state.start('Menu');
    },
};
