module.exports = Data = {};

Data.scoreLevels = {
  0: 1,
  100: 2,
  250: 3,
  450: 4,
  700: 5,
  1000: 6,
  1350: 7,
  1800: 8
}

Data.levels = {
  1: {
    fallSpeed:2,
  },
  2: {
    fallSpeed:2.2,
  },
  3: {
    fallSpeed:2.5,
  },
  4: {
    fallSpeed:2.8,
  },
  5: {
    fallSpeed:3.2,
  },
  6: {
    fallSpeed:3.6,
  },
  7: {
    fallSpeed:4.0,
  },
  8: {
    fallSpeed:4.4,
  }
}
var totalLevels = Object.keys(Data.levels).length;


// Increase sound by a half step each level

Data.levels[1].soundFrequency = 1/150;
var halfstep = 1.05946;
for (var l = 2; l < totalLevels; l++ ) {
  Data.levels[l].soundFrequency = Data.levels[l-1].soundFrequency * halfstep;
}

Data.dangerZones = [
  {color: 0x00ff00, radius: 100, text: ""},
  {color: 0xaaff00, radius: 150, text: "Keep an eye on this one"},
  {color: 0xff4400, radius: 200, text: "Warning: Approaching destabilization!"},
  {color: 0xff0000, radius: 250, text: "!!! DESTABILIZED !!", death: true},
]

Data.pulseTypes = {
  standard: {
    frequency: 0.1,
    params: [
      {type: 'sine', magnitude: [40, 0.5], freq: [1/30, 0.01]},
      {type: 'gaussian', spread: [100, 50], shift: [Settings.gameDims.x / 2, 0]}
    ]
  },
  easy: {
    frequency: 0.9,
    params: [
      // 4 not 2 ???????
      {type: 'sine', magnitude: [50, 20], freq: [1/400, 0.01], shift: [Settings.gameDims.x / 4, 0]},
      {type: 'gaussian', spread: [400, 100], shift: [Settings.gameDims.x / 4, 0]}
    ]
  }


}
