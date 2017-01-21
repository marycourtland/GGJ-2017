// not included in browserify bundle
window.Settings = {};

// ok this could go in a lib somewhere
function getUrlParam(key) {
    var match = window.location.search.match(new RegExp(key + '=([^?&]*)', 'i'));
    if (match && match[1]) return match[1];
    else return null;
}

Settings.gameDims = {x: window.innerWidth, y: window.innerHeight}
Settings.dx = 1;
