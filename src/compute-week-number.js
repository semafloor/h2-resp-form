// compute-week-number.js
const _weekdayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function _getWeekNumber (_fulldate) {
  let _now = new Date(_fulldate);
  _now = new Date(_now.getFullYear(), _now.getMonth(), _now.getDate() - _now.getDay() + 4);
  let _onejan = new Date(_now.getFullYear(), 0, 1);
  return Math.ceil(((_now - _onejan) / 86400000 + 1) / 7);
}

function _filterMultipleDays (_multipleDays) {
  return _multipleDays.filter((day) => {
    let _newDate = new Date(day);
    return _newDate.getDay() > 0 && _newDate.getDay() < 6;
  });
}

function _getWeekdayName (_fulldate, _weekdayNames) {
  return _weekdayNames[new Date(_fulldate).getDay()];
}

module.exports = (_multipleDays) => _filterMultipleDays(_multipleDays).map((_day) => {
  return {
    fulldate: _day,
    weekdayName: _getWeekdayName(_day, _weekdayNames),
    weekNumber: _getWeekNumber(_day)
  }
});