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
    fallSpeed:2
  },
  2: {
    fallSpeed:2.2
  },
  3: {
    fallSpeed:2.5
  },
  4: {
    fallSpeed:2.8
  },
  5: {
    fallSpeed:3.2
  },
  6: {
    fallSpeed:3.6
  },
  7: {
    fallSpeed:4.0
  },
  8: {
    fallSpeed:4.4
  }
}

Data.dangerZones = [
  {color: 0x00ff00, radius: 100, text: ""},
  {color: 0xaaff00, radius: 150, text: "Keep an eye on this one"},
  {color: 0xff4400, radius: 200, text: "Warning: Approaching destabilization!"},
  {color: 0xff0000, radius: 250, text: "!!! DESTABILIZED !!", death: true},
]
