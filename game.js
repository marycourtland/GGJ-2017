var Settings = window.Settings;
var View = require('./view')

// view-independent modules
var Context = {
}

window.game = {};

window.onload = function() {
    View.load(Context);
}

// Prevent all scrolling
window.addEventListener("keydown", function(e) {
    // space, page up, page down and arrow keys:
    if([32, 33, 34, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
        e.preventDefault();
    }
}, false);
