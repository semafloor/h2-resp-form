// ###
// READ operation of roomify API...
const _ = require('lodash');
const computeTimeMask = require('./compute-time-mask');
const convert32BitBinToHex = require('./convert32BitBinToHex');
const getWeek = require('./getWeek');
const searchForEmptyRoom = require('./searchForEmptyRoom');

// constants;
// const matchMonth = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
// const fireTower = [
//   ['01level', '02level', '03level', '04level', '05level', '06level', '07level', '08level', '09level', '10level', '11level', '12level'],
//   ['03level'],
//   ['01level']
// ];
// const fireSite = ['alpha', 'beta', 'gamma'];

// variables;
let hexTime = '';
let notSingleDay = false;
let readySemaphore = 1; // TODO: what is readySemaphore?

// roomifyRead module...
export function roomifyRead (_requestBody, res) {
  // testing if function imported working...
  console.log(`Inside roomifyRead module,
  Request Body: ${!_requestBody}`);
  let _testStart = '11:00';
  let _testEnd = '20:00';
  console.log(`\ntestStart: ${_testStart}\ntestEnd: ${_testEnd}`);
  console.log(`Time Mask in BIN: ${computeTimeMask.computeTimeMask(_testStart, _testEnd).join('')}`);
  console.log(`Time Mask in HEX: ${convert32BitBinToHex.convert32BitBinToHex(computeTimeMask.computeTimeMask(_testStart, _testEnd).join(''))}`);
  
  // check if req.body is not empty...
  if (_requestBody) {
    // if not full day (0800 - 2330)...
    if (_requestBody.tStart && _requestBody.tEnd) {
      let _startTime = _requestBody.tStart;
      let _endTime = _requestBody.tEnd;
      
      // trim time values from query-string if longer than 5;
      if (_startTime.length > 5 || _endTime.length > 5) {
        _startTime = _startTime.slice(0, 5);
        _endTime = _endTime.slice(0, 5);
      }
      // convert time mask array into HEX from BIN;
      // TODO: Can be optimized to skip conversion when time is all day;
      hexTime = convert32BitBinToHex.convert32BitBinToHex(computeTimeMask.computeTimeMask().join(''));
    }
    
    // if TYPES found inside search-query-string...
    // and TYPES must be greater than 0 in HEX;
    let hexTypes = (_requestBody.types && _requestBody.types > 0) ? _requestBody.types : '';
    
    // if SITE and FLOOR are found...
    // TODO: Find out what are notSite and notFloor;
    let notSite = _requestBody.site ? true : false;
    let notFloor = _requestBody.floor ? true: false;
    
    // compute single day OR multiple days...
    // instantiate new Date Object from startDate;
    let _getNewStartDate = new Date(_requestBody.startDate);
    let _getStartYear = _getNewStartDate.getFullYear();
    let _getStartMonth = _getNewStartDate.getMonth();
    let _getStartDate = _getNewStartDate.getDate();
    
    // instantiate new Date Object from endDate;
    let _getNewEndDate = new Date(_requestBody.endDate);
    let _getEndYear = _getNewEndDate.getFullYear();
    let _getEndMonth = _getNewEndDate.getMonth();
    let _getEndDate = _getNewEndDate.getDate();
    
    // TODO: return error if _getNewEndDate < _getNewStartDate;
    
    // multiple days from startDate;
    if (_getNewEndDate > _getNewStartDate) {
      notSingleDay = true;
      let _totalDays = (_getNewEndDate - _getNewStartDate) / 86400000 + 1;
      let _multipleDays = [];
      
      for (let i = 0; i < _totalDays; i++) {
        let _newDate = new Date(_getStartYear, _getStartMonth, (_getNewStartDate.getDate() + i));
        if (_newDate.getDay() > 0 && _newDate.getDay() < 6) {
          _multipleDays.push(_newDate.toJSON().slice(0, 10));
        }
      }
      
      // TODO: investigate readySemaphore;
      readySemaphore *= _multipleDays.length;
      
      // Start computing empty room...
      // and IF _multipleDays is not empty;
      if (_.isEmpty(_multipleDays)) {
        res.send('<h1>The selected day(s) is(are) either (a) weekend or holiday!</h1>');
      }else {
        // Here, using _multipleDays.length because weekends and holidays
        // are taken into account. Final length might change.
        let _multipleFilteredDays = [];
        for (let j = 0; j < _multipleDays.length; j++) {
          let _getMultipleNewDate = new Date(_multipleDays[j]);
          let _getMultipleYear = _getMultipleNewDate.getFullYear();
          let _getMultipleMonth = _getMultipleNewDate.getMonth();
          let _getMultipleDate = _getMultipleNewDate.getDate();
          let _getMultipleWeekNumber = getWeek.getWeek(_multipleDays[j]);
          
          // create new array for filtered days;
          _multipleFilteredDays.push[{
            weekNumber: _getMultipleWeekNumber,
            year: _getMultipleYear,
            month: _getMultipleMonth,
            date: _getMultipleDate,
            fulldate: _multipleDays[j]
          }];
        }
        
        // TODO: Keep track on Promise to ensure better performance;
        // map filtered days into array of Promises;
        let _multiplePromises = _multipleFilteredDays.map((elem) => {
          // TODO: investigate importance of getFromSite();
          return new Promise((resolve, reject) => {
            resolve(searchForEmptyRoom.searchForEmptyRoom(elem.weekNumber, elem.year, elem.month, elem.date, elem.fulldate, notFloor, notSite, _requestBody.capacity, _requestBody.types, _requestBody.site, _requestBody.floor, hexTime));
          });
        });
        // Ensure all Promises fullfilled;
        Promise.all(_multiplePromises).then((result) => {
          console.log(`${result}`);
        }).catch((reason) => {
          console.log(`Error happened in promises: ${reason}`);
        });
        
      }
    }else {
      // single day OR only startDate;
      // if _getNewStartDate happens to fall on weekdays...
      // TODO: To detect if today is a holiday;
      if (_getNewStartDate.getDay() > 0 && _getNewStartDate.getDay() < 6) {
        // search for empty room;
        searchForEmptyRoom.searchForEmptyRoom(getWeek.getWeek(_requestBody.startDate), _getStartYear, _getStartMonth, _getStartDate);
      }else {
        res.send('<h1>The selected day(s) is(are) either (a) weekend or holiday!</h1>');
      }
    }
  }
}