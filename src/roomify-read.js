// roomify-read.js
const _ = require("lodash");
const Firebase = require('firebase'); 

exports.findEmptyRoom = function (_snapshot, _refURL, _fulldate, _emptyRoomCapacityMask, _emptyRoomTimeMask, _emptyRoomTypesMask) {
  let _emptyRoomsGroupedBySite = {};
  let _finalEmptyRooms = {};
  let _emptyRooms = [];

  function _compareAndMatchCapacity (_roomCapacity, _emptyRoomCapacityMask) {
    return _roomCapacity >= _emptyRoomCapacityMask;
  }

  function _compareAndMatchTime (_roomTime, _emptyRoomTimeMask) {
    return ((_roomTime & _emptyRoomTimeMask) >>> 0) === 0;
  }

  function _compareAndMatchTypes (_roomTypes, _emptyRoomTypesMask) {
    return ((_roomTypes & _emptyRoomTypesMask) >>> 0) === parseInt(_emptyRoomTypesMask);
  }

  _snapshot.forEach((_site) => {
    _site.forEach((_floor) => {
      _floor.forEach((_room) => {
        let _roomTimeInDec = parseInt(_room.val().time, 16).toString(10);
        let _roomTypesInDec = parseInt(_room.val().types, 16).toString(10);
        let _isMatchedCapacity = _compareAndMatchCapacity(_room.val().capacity, _emptyRoomCapacityMask);
        let _isMatchedTime = _compareAndMatchTime(_roomTimeInDec, _emptyRoomTimeMask);
        let _isMatchedTypes = _compareAndMatchTypes(_roomTypesInDec, _emptyRoomTypesMask);

        if (_isMatchedCapacity && _isMatchedTime && _isMatchedTypes) {
          // console.log(_site.key(), _floor.key(), _room.key(), _room.val().time, _room.val().types);
          _emptyRooms.push({
            site: _site.key(),
            floor: _floor.key(),
            room: _room.key(),
            time: _room.val().time,
            types: _room.val().types,
            capacity: _room.val().capacity
          });
        }
      });
    });
  });

  _.forIn(_.groupBy(_emptyRooms, 'site'), (value, key) => {
    _emptyRoomsGroupedBySite[key] = _.groupBy(value, 'floor');
  });
  _finalEmptyRooms['available'] = _emptyRoomsGroupedBySite;
  _finalEmptyRooms['totalEmptyRooms'] = _.size(_emptyRooms);
  _finalEmptyRooms['refURL'] = _refURL;
  _finalEmptyRooms['fulldate'] = _fulldate;
  _emptyRooms = []; _emptyRoomsGroupedBySite = {};
  return _finalEmptyRooms;
}

// groupBy callback;
// result will contain 2 arrays;
// result[0] contains objects;
// result[1] can be arrays of objects or objects;
function partitionEmptyRooms (_part) {
  let part0 = _.partition(_part, (n,i,a) => !_.isEqual(n.available, a[0].available));
    if (part0[0].length > 0) {
      // console.log('cb');
      let part1 = partitionEmptyRooms(part0[0]);
      return [part0[1], part1];
    }else {
      // console.log('return');
      return part0[1];
  }
}

// single item array will break the code;
function splitPartitionIntoGroups (_parted) {
  if (_parted.length < 2 || !_.isArray(_parted[0])) {
    console.log('partition special route');
    return [_parted];
  }

  let _union = [];
  let _temp = [];

  for (let i = 0; i < _parted.length; i++) {
    for (let j = 0; j < _parted[i].length; j++) {
      if (_.isArray(_parted[i][j])) {
        _union.push(_parted[i][j]);
      }else {
        _temp.push(_parted[i][j]);
      }
    }
  }
  _union.push(_temp);
  _temp = [];
  return _union;
}

function findIntersection (_parted) {
  let _proxies = [];
  let _siteIntersection = [];
  let _floorIntersection = [];
  let _unequalRoomsLength = 0;
  let _unequalRoomsNextLength = 0;
  let _intersection = {};

  // when there is only 1 partition and no comparison...
  if (_parted.length < 2) {
    return _parted[0][0].available;
  }

  // when more than 1 partitions, only take the first one as sample...
  for (let i = 0; i < _parted.length; i++) {
    _proxies.push(_parted[i][0].available);
  }
  // console.log('##################');
  // console.log(_parted);
  // console.log(_proxies);

  for (let j = 0; j < (_proxies.length - 1); j++) {
    // Only care about intersecting sites;
    _siteIntersection = _.intersection(_.keys(_proxies[j]), _.keys(_proxies[j + 1]));
    // console.log(_siteIntersection);
    for (let k = 0; k < _siteIntersection.length; k++) {
      // Only care about intersecting floors;
      _floorIntersection = _.intersection(_.keys(_proxies[j][_siteIntersection[k]]), _.keys(_proxies[j + 1][_siteIntersection[k]]));
      // console.log(_floorIntersection);
      for (let l = 0; l < _floorIntersection.length; l++) {
        // When the floor[0] is exactly the same as floor[1];
        if (_.isEqual(_proxies[j][_siteIntersection[k]][_floorIntersection[l]], _proxies[j + 1][_siteIntersection[k]][_floorIntersection[l]])) {
          // console.log(_floorIntersection[l]);
          // console.log('is-equal');
          // To create multidimensional object, first dimension must be defined;
          // Only define one if it's undefined or first use;
          if (_.isUndefined(_intersection[_siteIntersection[k]])) {
            _intersection[_siteIntersection[k]] = {};
          }
          _intersection[_siteIntersection[k]][_floorIntersection[l]] = _proxies[j][_siteIntersection[k]][_floorIntersection[l]];
          // console.log(_intersection);
        }else {
          // console.log('not-equal');
          // When floor[0] and floor[1] have different structures;
          _unequalRoomsLength = _proxies[j][_siteIntersection[k]][_floorIntersection[l]].length;
          _unequalRoomsNextLength = _proxies[j + 1][_siteIntersection[k]][_floorIntersection[l]].length;
          for (let m = 0; m < _unequalRoomsLength; m++) {
            // cross checking needed; a[0] -- b[0], a[0] -- b[1], ....
            for (let n = 0; n < _unequalRoomsNextLength; n++) {
              // console.log('cross-checking');
              // Only care about existing rooms;
              if (_.isEqual(_proxies[j][_siteIntersection[k]][_floorIntersection[l]][m], _proxies[j + 1][_siteIntersection[k]][_floorIntersection[l]][n])) {
                // console.log(_proxies[j][_siteIntersection[k]][_floorIntersection[l]][m]);
                // console.log(_proxies[j + 1][_siteIntersection[k]][_floorIntersection[l]][n]);
                // console.log('not-equal-is-equal');
                // console.log(_proxies[j][_siteIntersection[k]][_floorIntersection[l]][m]);
                // To create multidimensional object, first dimension must be defined;
                // Only define one if it's undefined or first use;
                if (_.isUndefined(_intersection[_siteIntersection[k]])) {
                  _intersection[_siteIntersection[k]] = {};
                }
                _intersection[_siteIntersection[k]][_floorIntersection[l]] = _proxies[j][_siteIntersection[k]][_floorIntersection[l]][m];
              }
            }
          }
        }
      }
    }
    // console.log('proxies');
    // console.log(j, _proxies.length);
    // console.log(_proxies[j]);
    // console.log(_intersection);
    // If it's last 2 don't replace _proxies value and it's ready to be output;
    if (j < (_proxies.length - 2)) {
      _proxies[j] = _intersection;
      _intersection = {}; // clear _intersection after successful consecutive intersection;
    }
    // console.log(_proxies[j]);
  }
  return _intersection;
}

// deep count number of rooms of final filtered result;
let _countTotalEmptyRooms = (_filteredResult) => {
  let _total = 0;
  return _.reduce(_filteredResult, (total, n) => {
    return _.reduce(n, (total, n) => {
      _total = _total + _.size(n);
      return _total;
    }, 0);
  }, 0);
};


// if floor and/ or site is specified;
// RAW data: startDate=2015-12-22&endDate=2015-12-22&tStart=22%3A29&tEnd=22%3A29&capacity=1&site=&floor=&types=0
function _filterResultBasedOnFloorAndSite (_finalEmptyRooms, _site, _floor) {
  if (!_.isEmpty(_site) && _.isString(_site)) {
    let _filteredSite = {};
    if (_.keys(_finalEmptyRooms).indexOf(_site) >= 0) {
      _filteredSite = _.pick(_finalEmptyRooms, _site);
    }else {
      return {};
    }

    if (!_.isEmpty(_floor) && _.isString(_floor)) {
      if (_.keys(_filteredSite[_site]).indexOf(_floor) >= 0) {
        _filteredSite[_site] = _.pick(_filteredSite[_site], _floor);
        return _filteredSite;
      }
    }

    return _filteredSite;
  }

  return _finalEmptyRooms;
};

// To be able to log elapsed time on both Node and browser;
function logElapseTime (_endLabel) {
  try {
    if (_endLabel) {
      return process.hrtime(_endLabel);
    }
    return process.hrtime();
  }catch (e) {
    return window.performance.now();
  }
};

// For signal tower approach,
//(N-1)+(N-2)+(N-3)+(N-4)+(N-5)+(N-6)+(N-7) => N(N-n)/2, N = 8, n >= 1
// Say N = 8, total number of execution loop will be (8)(8-1)/2 = 56/2 = 28 #

// TODO: Create more random data to filter out if some days do not have empty room that meets the search criteria;
exports.roomifyRead = (_emptyRoomsResult, _emptyRoomSiteMask, _emptyRoomFloorMask) => {
  console.log('\n@@@ ############## Filtering... ################ ');
  let roomifyRead = process.hrtime();
  let _parted = [];
  let _finalIntersectionResult = [];
  let _finalFilteredResultWithRoomCount = {};
  
  _emptyRoomsResult = _.sortBy(_emptyRoomsResult, 'fulldate');
  // console.log(_emptyRoomsResult);
  _parted = splitPartitionIntoGroups(partitionEmptyRooms(_emptyRoomsResult));
  // console.log(_parted);
  _finalIntersectionResult = findIntersection(_parted);
  // console.log(_finalIntersectionResult);
  _finalFilteredResultWithRoomCount = _filterResultBasedOnFloorAndSite(_finalIntersectionResult, _emptyRoomSiteMask, _emptyRoomFloorMask);
  _finalFilteredResultWithRoomCount['totalEmptyRooms'] = _countTotalEmptyRooms(_finalFilteredResultWithRoomCount);
  let roomifyReadEnd = process.hrtime(roomifyRead);
  console.log('\n3) Time elapsed in filtering results with room count:\t %dms', (roomifyReadEnd[0] * 1E3 + roomifyReadEnd[1] * 1E-6).toFixed(3));
  // console.log(finalFilteredResultWithRoomCount);
  return _finalFilteredResultWithRoomCount;
};
