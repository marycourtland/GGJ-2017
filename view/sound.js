var xy = window.XY;
var createWaveform = require('./createwaveform');
module.exports = sound = {};

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var masterVolume = audioCtx.createGain();
masterVolume.connect(audioCtx.destination);
masterVolume.gain.value = 0.5;


sound.masterWaveform = [
  {type: 'sine', magnitude: [1, 0], freq: [1/150, 0]},
];

sound.setMasterFrequency = function(f) {
  this.masterWaveform[0].freq[0] = f;
}

sound.playData = function(data, secondsInData) {
  function normalize(data) {
    var max = 0;
    data.forEach(function(d) { max = Math.max(max, Math.abs(d)); })
    return data.map(function(d) { return d / max; })
  }

  function downsample(data, framesPerDatum, shouldInterpolate) {
    var output = [];
    var D = data.length;
    for (var i = 0; i < framesPerDatum * D; i++) {
      var _i = Math.floor(i / framesPerDatum);

      if (shouldInterpolate) {
        var di = i % framesPerDatum;
        var p1 = xy(_i, data[_i]);
        var p2 = xy(_i + 1, data[_i + 1]);
        var x = _i + di / framesPerDatum; 
        var next = interpolate(x, p1, p2).y
      }

      output.push(next);
    }
    return output;
  }

  var normalizedData = normalize(data);
  var D = data.length;

  // How many audio frames per data points?
  var framesInData = audioCtx.sampleRate * secondsInData;
  var framesPerDatum = framesInData / D;

  // Adjust the time span so that framesPerDatum is an integer
  framesPerDatum -= (framesPerDatum % 1);
  framesinData = framesPerDatum * D;
  secondsInData = framesInData / audioCtx.sampleRate;
  var totalFrames = audioCtx.sampleRate * secondsInData;

  var downsampled = downsample(normalizedData, framesPerDatum, true);
  var outputData = [];
  var waveform = createWaveform(sound.masterWaveform);
  for (var i = 0; i < downsampled.length; i++) {
    outputData.push(downsampled[i] * waveform(i));
  }
  

  // Output data to audio buffer
  var wavelineBuffer = audioCtx.createBuffer(2, totalFrames, audioCtx.sampleRate);

  for (var channel = 0; channel < 2; channel++) {
    var buffering = wavelineBuffer.getChannelData(channel);
    for (var i = 0; i < totalFrames; i++) {
      var _i = Math.floor(i / framesPerDatum);
      //buffering[i] = normalizedData[_i];
      buffering[i] = outputData[i];
    }
  }

  var source = audioCtx.createBufferSource();
  source.buffer = wavelineBuffer;
  source.connect(masterVolume);
  source.start();
}

interpolate = function(x, p1, p2) { // Linear
  if (!p1) { return xy(p2.x, p2.y); }
  if (!p2) { return xy(p1.x, p1.y); }
  if (p1.x === p2.x) { return xy(p1.x, p2.y); }

  var f = (x - p1.x) / (p2.x - p1.x);
  return xy(x, p1.y + f*(p2.y - p1.y));
}
