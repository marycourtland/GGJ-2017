// not included in browserify bundle
window.Settings = {};

// ok this could go in a lib somewhere
function getUrlParam(key) {
    var match = window.location.search.match(new RegExp(key + '=([^?&]*)', 'i'));
    if (match && match[1]) return match[1];
    else return null;
}

Settings.gameDims = {x: 800, y: 600} 
Settings.dx = 1; // line resolution

Settings.cell = 20; // everything discretized
Settings.shiftCooldown = 5;

// color of lines and stuff
Settings.gameColor= 0x0011cc;
Settings.gameColorStr = '#0011cc';

Settings.shiftSpeed = 2;
Settings.fallSpeed = 2;
Settings.superFallSpeed = 8;
Settings.rotateScale = 1/50;


Settings.inputStart = 100;

