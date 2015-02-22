var cp = require('child_process');

module.exports = {
 imagesnap: function(filename) {
  return cp.spawn('imagesnap', [
    '-w',
    3.0,
    filename,
  ]);
 },
 fswebcam: function(filename) {
  return cp.spawn('fswebcam', [
    '-r',
    '1280x720',
    '-D',
    3.0,
    '--no-banner',
    '--skip',
    10,
    filename,
  ]);
 },
};
