var Settings = window.Settings;
var View = require('./view')

// view-independent modules
var Context = {
}

window.game = {};

window.onload = function() {
    View.load(Context);
}
