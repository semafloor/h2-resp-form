// compute-day-url.js
const _monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

function _getMonthName (_newDate) {
  return `00${_newDate.getMonth()}`.slice(-2) + _monthNames[_newDate.getMonth()];
}

function _formURL (_fulldate, _weekNumber) {
  let _newDate = new Date(_fulldate);
  return [_newDate.getFullYear(), _getMonthName(_newDate), `week` + `00${_weekNumber}`.slice(-2), `00${_newDate.getDate()}`.slice(-2)].join('/');
}

module.exports = (_filteredDays) => _filteredDays.map((_day) => {
    return {
      fulldate: _day.fulldate,
      weekNumber: _day.weekNumber,
      weekdayName: _day.weekdayName,
      refURL: _formURL(_day.fulldate, _day.weekNumber)
    }
  });