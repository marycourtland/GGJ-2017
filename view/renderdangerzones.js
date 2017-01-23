var Data = require('./data');

module.exports = renderDangerZones = function(g) {
  // Set up danger zones
  var y = 0;
  Data.dangerZones.forEach(function(zone) {
    var yPrev = y;
    y = zone.radius;

    var y0 = Settings.gameDims.y/2;
    var xmax = Settings.gameDims.x;

    g.beginFill(zone.color, 0.5)
    g.drawRect(0, y0 - y, xmax, y - yPrev);
    g.drawRect(0, y0 + yPrev, xmax, y - yPrev)
    g.endFill();
  })  
}

