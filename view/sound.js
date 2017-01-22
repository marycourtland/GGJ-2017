module.exports = sound = {};


var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

var masterVolume = audioCtx.createGain();
masterVolume.connect(audioCtx.destination);
masterVolume.gain.value = 1;

sound.playData = function(data, secondsInData) {
  function normalize(data) {
    var max = 0;
    data.forEach(function(d) { max = Math.max(max, Math.abs(d)); })
    return data.map(function(d) { return d / max; })
  }

  var normalizedData = normalize(data);
  var D = data.length;

  // How many audio frames per data points?
  var framesInData = audioCtx.sampleRate * secondsInData;
  var framesPerDatum = framesInData / D;

  // Adjust the time span so that framesPerDatum is an integer
  framesPerDatum -= (framesPerDatum % 1);
  framesinData = framesPerDatum * D;
  secondsInData = framesInData / audioCtx.sampleRate;80
  var totalFrames = audioCtx.sampleRate * secondsInData;

  // Output data to audio buffer

  var wavelineBuffer = audioCtx.createBuffer(2, totalFrames, audioCtx.sampleRate);

  for (var channel = 0; channel < 2; channel++) {
    var buffering = wavelineBuffer.getChannelData(channel);
    for (var i = 0; i < totalFrames; i++) {
      var _i = Math.floor(i / framesPerDatum);
      buffering[i] = normalizedData[_i];
    }
  }

  var source = audioCtx.createBufferSource();
  source.buffer = wavelineBuffer;
  source.connect(masterVolume);
  source.start();
}

