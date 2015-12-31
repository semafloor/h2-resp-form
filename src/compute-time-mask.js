// compute-time-mask.js
/*
  1. To find position of _startTime:
    - convert _startTime: 11:00 => 11 * 60 + 0 * 30 = 660;
    - convert initial Time: 8:00 => 8 * 60 + 0 * 30 = 480;
    - _positionOfStartTime = (660 - 480) / 30 = 6 (0 is the starting index);
  2. To find length of the time masking:
    - convert _endTime: 17:00 => 17 * 60 + 0 * 30 = 1020;
    - get converted _startTime: 11:00 => 660;
    - _lengthOfTimeMask = ((1020 - 660) / 30) + 1 = 13 (6 is the starting index);
*/
const _ = require('lodash');

// convert extractions into time index; 
// NOTE: endTime first then startTime.
function convertTimeIntoIdx (_endTimeInMinutes, _startTimeInMinutes=480) {
  return (_endTimeInMinutes - _startTimeInMinutes) / 30;
}

// extract hours and minutes from given time;
function convertTimeIntoMinutes (_time) {
  let _hours = parseInt(_time.slice(0, 2));
  let _minutes = parseInt(_time.slice(-2));
  
  return (_hours * 60 + _minutes);
}

module.exports = (_startTime='08:00', _endTime='23:30') => {
  // compute _startPos
  let _startTimeInMinutes = convertTimeIntoMinutes(_startTime);
  let _endTimeInMinutes = convertTimeIntoMinutes(_endTime);
  let _startPos = convertTimeIntoIdx(_startTimeInMinutes);
  
  // compute time length starting from _startTime;
  let _timeLength = convertTimeIntoIdx(_endTimeInMinutes) + 1;
  // console.log(`${_startTimeInMinutes} ${_endTimeInMinutes} ${_startPos} ${_timeLength}`);
  return parseInt(_.fill(_.fill(Array(32), 0), 1, _startPos, _timeLength).join(''), 2).toString(10);
}