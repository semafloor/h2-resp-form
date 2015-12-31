// const _ = require('lodash');
// compute-multiple-days.js

function filterMultipleDays (_multipleDays) {
  return _multipleDays.filter((day) => {
    let _newDate = new Date(day);
    return _newDate.getDay() > 0 && _newDate.getDay() < 6;
  });
}

function prependZero (_string) {
  return `00${_string}`.slice(-2);
}

function dateText (_fullyear, _month, _day) {
  return [_fullyear, prependZero(_month), prependZero(_day)].join('-');
}

function computeDates(_startDate, _endDate) {
  let _totalDays = (new Date(_endDate).getTime() - new Date(_startDate).getTime()) / 86400000 + 1;
  let _dates = [];
  let _newDate = new Date(_startDate);
  let _getFullYear = _newDate.getFullYear();
  let _getMonth = _newDate.getMonth();
  let _getDate = _newDate.getDate();
  for (let i = 0; i < _totalDays; i++) {
    let _getNewDate = new Date(_getFullYear, _getMonth, (_getDate + i));
    _dates.push(dateText(_getNewDate.getFullYear(), _getNewDate.getMonth() + 1, _getNewDate.getDate()));
  }
  _dates = filterMultipleDays(_dates);
  return _dates;
}

module.exports = (_startDate, _endDate) => computeDates(_startDate, _endDate);