// search for empty room from Firebase...
// TODO: To investigate importance of getFromSite();
// TODO: To complete porting showRoom function.
const matchMonth = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const fireTower = [
  ['01level', '02level', '03level', '04level', '05level', '06level', '07level', '08level', '09level', '10level', '11level', '12level'],
  ['03level'],
  ['01level']
];
const fireSite = ['alpha', 'beta', 'gamma'];
const Firebase = require('firebase');
const semafloorRef = new Firebase('https://polymer-semaphore.firebaseio.com/mockMessages');
let _notSite;
let _notFloor;
let _types;
let _capacity;

// get time from room;
function _getTime (url, hexTime) {
  // TODO: port _getTime function;
  // return room time and room url if matched;
  semafloorRef.child(url).orderByKey().on('value', (snapshot) => {
    if (snapshot.val() === null) {
      // regardless of notSingleDay, Promise(s) does not need that anymore;
      
    }else {
      let totalRoomNumber = 0;
      // count total number of rooms;
      if (notSite || notFloor || !notSite && !notFloor) {
        snapshot.forEach((data) => {
          // TODO: See if _.size can be applied here;
          if (data.key()) totalRoomNumber++;
        });
      }
      // loop thru and find match;
      snapshot.forEach((data) => {
        let _currentRoomInfo;
        let _checkFinal = true;
        if (hexTime) {
          // TODO: port matchTimeQuery function;
        }
        
        if (_capacity) {
          // TODO: port matchCapacityQuery function;
        }
        
        if (_types) {
          // TODO: port matchTypesQuery function;
        }
        
        len--;
      });
    }
  });
}

// making Promise(s);
function _makePromisesFromURL (allURLArray, hexTime) {
  return allURLArray.map((url) => {
    return new Promise((resolve, reject) => {
      // TODO: PART 3 - resolve all URLs using getTime;
      resolve(_getTime(url, hexTime));
    });
  });
}

// find match;
// function () {}

// match all time and find empty room;
function _matchAndFindEmptyRoom (allURLArray) {
  Promise.all(_makePromisesFromURL(allURLArray)).then((allRoomTime) => {
    // TODO: allRoomTime will return array of empty rooms;
  }).catch((reason) => {
    console.log(`Error at _makePromisesFromURL`);
    console.log(reason);
  });
}

// main function;
export function searchForEmptyRoom (weekNumber, year, month, date, fulldate, notFloor, notSite, capacity,  types, site, floor, hexTime) {
  // make them public;
  _notSite = notSite;
  _notFloor = notFloor;
  _types = types;
  _capacity = capacity;
  
  // config new Firebase location;
  let _monthURL = '0' + month + matchMonth[month];
  let _dayURL = '/' + year + '/' + _monthURL + '/week' + weekNumber + '/' + date + '/site';
  let _fullURL = '';
  
  // validate FLOOR && SITE;
  let setFloorCount = 0;
  let floorCount = 0;
  let setSiteCount = 0;
  let siteCount = 0;
  let _getAllRoomTime = [];
  let _matchedEmptyRoom = [];
  
  if (notFloor) {
    setFloorCount = 1;
    floorCount = 1;
    setSiteCount = 1;
    siteCount = 1;
    
    if (notSite) {
      _fullURL = _dayURL + '/' + site + '/' + floor;
      // TODO: Promise (_fullURL, getTIme);
      _getAllRoomTime.push(_fullURL);
      _matchedEmptyRoom = _matchAndFindEmptyRoom(_getAllRoomTime, hexTime);
    }else {
      // when FLOOR === 1 && SITE === 0...
      // placeholder;
    }
  }else {
    setSiteCount = 1;
    siteCount = 1;
    if (notSite) {
      // when FLOOR === 0 && SITE === 1...
      setFloorCount = 1;
      floorCount = 1;
      // generating URL to all rooms of all sites...
      if (site !== 'alpha') {
        let setFloor = (site === 'suite') ? '01level' : '03level';
        _fullURL = _dayURL + '/' + site + '/' + floor;
        // TODO: PART 1 - Promise (_fullURL, getTime);
        // Here, to make things consistent for makig Promise(s);
        // always create an array to store URL of all rooms of all sites;
        _getAllRoomTime.push(_fullURL);
      }else {
        setFloorCount = 12;
        floorCount = 12;
        // loop thru alpha tower all 12 floors;
        for (let i = 0; i < fireTower.length; i++) {
          _fullURL = _dayURL + '/' + site + '/' + floor;
          // TODO: PART 1 - Promise (_fullURL, getTime);
          // Here, to make things consistent for makig Promise(s);
          // always create an array to store URL of all rooms of all sites;
          _getAllRoomTime.push(_fullURL);
        }
      }
      // TODO: PART 2 - map generated array for Promise(s);
      // return matched empty room;
      _matchedEmptyRoom = _matchAndFindEmptyRoom(_getAllRoomTime, hexTime);
    }else {
      // when FLOOR && SITE are 0...
      setFloorCount = 14;
      floorCount = 14;
      // loop thru all floors at all sites;
      for (let j = 0; j < fireSite.length; j++) {
        if (fireTower[j].length > 1) {
          for (let k = 0; k < fireTower[j].length; k++) {
            _fullURL = _dayURL + '/' + fireSite[j] + '/' + fireTower[j][k];
            _getAllRoomTime.push(_fullURL);
          }
        }else {
          _fullURL = _dayURL + '/' + fireSite[j]+ '/' + fireTower[j][k];
          _getAllRoomTime.push(_fullURL);
        }
      }
      // TODO: PART 2 - map generated array for Promise(s);
      // return matched empty room;
      // A bit special, first 12 are from site alpha while
      // last 2 are from different sites;
      _matchedEmptyRoom = _matchAndFindEmptyRoom(_getAllRoomTime, hexTime);
    }
  }
}