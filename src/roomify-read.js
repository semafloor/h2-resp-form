// roomify-read.js
const _ = require("lodash");
const Firebase = require('firebase');

// How to search for an empty room that meets the search criteria.
// Precedence of search criterium:
// DATE
// TIME
// SITE
// FLOOR
// CAPACITY
// TYPES
// How result will be generated:
// Date Time Site Floor Capacity Types Done Result
//    1    1    0     0        0     0    X Returns all empty rooms that meet DATE, TIME.
//    1    1    0     0        0     1    X Returns all empty rooms that meet DATE, TIME, TYPES.
//    1    1    0     0        1     0    X Returns all empty rooms that meet DATE, TIME, CAPACITY.
//    1    1    0     0        1     1    X Returns all empty rooms that meet DATE, TIME, CAPACITY, TYPES.

//    1    1    0     1        0     0    - X - Not allowed.
//    1    1    0     1        0     1    - X - Not allowed.
//    1    1    0     1        1     0    - X - Not allowed.
//    1    1    0     1        1     1    - X - Not allowed.

//    1    1    1     0        0     0    X Returns all empty rooms at SITE that meet DATE, TIME, SITE.
//    1    1    1     0        0     1    X Returns all empty rooms at SITE that meet DATE, TIME, SITE, TYPES.
//    1    1    1     0        1     0    X Returns all empty rooms at SITE that meet DATE, TIME, SITE, CAPACITY.
//    1    1    1     0        1     1    X Returns all empty rooms at SITE that meet DATE, TIME, SITE, CAPACITY, TYPES.

//    1    1    1     1        0     0    X Returns all empty rooms at SITE, FLOOR that meet DATE, TIME.
//    1    1    1     1        0     1    X Returns all empty rooms at SITE, FLOOR that meet DATE, TIME, TYPES.
//    1    1    1     1        1     0    X Returns all empty rooms at SITE, FLOOR that meet DATE, TIME, CAPACITY.
//    1    1    1     1        1     1    X Returns all empty rooms at SITE, FLOOR that meet DATE, TIME, CAPACITY, TYPES.

// X - TODO: Drop empty result before sending it out as response.
// X - TODO: Skip interactions, and dropping empty results if result happens to be empty.


// Compare the time.
function _compareTime(_timeHex, _maskDec) {
  let _timeDec = parseInt(_timeHex, 16).toString(10);
  return (_timeDec & _maskDec) >>> 0 === 0;
}
// Compare the types.
function _compareTypes(_typesHex, _maskDec) {
  let _typesDec = parseInt(_typesHex, 16).toString(10);
  return (_typesDec & _maskDec) >>> 0 === parseInt(_maskDec);
}
// Compare the capacity number.
function _compareCapacity(_capacityDec, _maskDec) {
  return _capacityDec >= _maskDec;
}

// Filter all rooms at SITE, FLOOR.
function _filterRoomByFloor(_snapshot, _maskTimeDec, _maskTypesDec, _maskCapacityDec) {
  console.log('_filterRoomByFloor snapshot: ', _snapshot);
  let _filtered = [];
  _.forEach(_snapshot, (n) => {
    // For each value of DATE which are all the rooms of a FLOOR.
    let _roomHasEmptySlot = _.pickBy(n.value, (o) => {
      // Compare ROOM's TIME.
      var _isTimeMet = _compareTime(o.time, _maskTimeDec);
      // Compare ROOM's TYPES.
      var _isTypesMet = _compareTypes(o.types, _maskTypesDec);
      // Compare ROOM's CAPACITY.
      var _isCapacityMet = _compareCapacity(o.capacity, _maskCapacityDec);
      return _isTimeMet && _isTypesMet && _isCapacityMet;
    });
    // Push all the empty ROOMs that meet the TIME criteria.
    if (!_.isEmpty(_roomHasEmptySlot)) {
      _filtered.push({ result: _roomHasEmptySlot, ref: n.ref });
    }
    // Then proceed to subsequent DATE...
  });
  console.log('_filterRoomByFloor: ', _filtered);
  return _filtered;
}
// Filter all rooms at SITE only.
function _filterRoomBySite(_snapshot, _maskTimeDec, _maskTypesDec, _maskCapacityDec) {
  console.log('_filterRoomBySite snapshot: ', _snapshot);
  let _filtered = [];
  _.forEach(_snapshot, (_site) => {
    let _filteredSite = {};
    _.forIn(_site.value, (_floor, _floorName) => {
      // For each value of DATE which are all the rooms of a FLOOR.
      let _roomHasEmptySlot = _.pickBy(_floor, (_room) => {
        // Compare ROOM's TIME.
        var _isTimeMet = _compareTime(_room.time, _maskTimeDec);
        // Compare ROOM's TYPES.
        var _isTypesMet = _compareTypes(_room.types, _maskTypesDec);
        // Compare ROOM's CAPACITY.
        var _isCapacityMet = _compareCapacity(_room.capacity, _maskCapacityDec);
        return _isTimeMet && _isTypesMet && _isCapacityMet;
      });
      // Push all the empty ROOMs to its corresponding _floorName that meet the TIME criteria.
      // if (!_.isEmpty(_roomHasEmptySlot)) {
        _filteredSite[_floorName] = { result: _roomHasEmptySlot, ref: _site.ref };
      // }
      // Then proceed to subsequent DATE...
    });
    // if (!_.isEmpty(_filteredSite)) {
      _filtered.push(_filteredSite);
    // }
  });
  console.log('_filterRoomBySite: ', _filtered);
  return _filtered;
}
// Filter all rooms without SITE, FLOOR.
function _filterRoom(_snapshot, _maskTimeDec, _maskTypesDec, _maskCapacityDec) {
  console.log('_filterRoom snapshot: ', _snapshot);
  let _filtered = [];
  _.forEach(_snapshot, (_date) => {
    let _filteredSite = {};
    _.forIn(_date.value, (_site, _siteName) => {
      let _filteredFloor = {};
      _.forIn(_site, (_floor, _floorName) => {
        let _roomHasEmptySlot = _.pickBy(_floor, (_room) => {
          let _isTimeMet = _compareTime(_room.time, _maskTimeDec);
          let _isTypesMet = _compareTypes(_room.types, _maskTypesDec);
          let _isCapacityMet = _compareCapacity(_room.capacity, _maskCapacityDec);

          return _isTimeMet && _isTypesMet && _isCapacityMet;
        });
        // If _roomHasEmptySlot is empty which means that no ROOM has met the search criteria
        // at this FLOOR.
        // if (!_.isEmpty(_roomHasEmptySlot)) {
          _filteredFloor[_floorName] = _roomHasEmptySlot;
        // }
      });
      // If _filteredFloor is empty which means that no ROOM at all FLOORS has met the search
      // criteria at this SITE.
      // if (!_.isEmpty(_filteredFloor)) {
        _filteredSite[_siteName] = _filteredFloor;
      // }
    });
    _filtered.push({ result: _filteredSite, ref: _date.ref });
  });
  console.log('_filterRoom: ', _filtered);
  return _filtered;
}

// Find out intersection ROOMs at SITE, FLOOR.
function _intersectionRoomByFloor(_result) {
  let _compare = [];
  // Grab and push all the keys of all empty ROOMs from all DATEs.
  _.forEach(_result, (n) => {
    _compare.push(_.keys(n.result));
  });
  // var _intersected = _.intersection.apply(null, _compare);
  // Spread an array of array of keys from each DATE.
  let _intersected = _.intersection(..._compare);
  let _emptyRoom = {};
  console.log(_intersected);
  // Iterate over array of keys over the first object of result since they are the same across DATEs.
  _.forEach(_intersected, (o) => {
    _emptyRoom[o] = _result[0].result[o];
  });

  return _emptyRoom;
}
// Find out intersection ROOMs at SITE only.
function _intersectionRoomBySite(_result) {
  console.log(_result);
  // Grab and push all the keys of all empty ROOMs from all DATEs.
  let _compare = {};
  _.forEach(_result, (_date) => {
    if (_.isEmpty(_compare)) {
      let _keys = _.keys(_date);
      _.forEach(_keys, (key) => {
        _compare[key] = [];
      });
    }
    _.forIn(_date, (_floor, _floorName) => {
      _compare[_floorName].push(_.keys(_floor.result));
    });
  });
  console.log(_compare);
  // var _intersected = _.intersection.apply(null, _compare);
  // Spread an array of array of keys from each DATE.
  let _intersected = {};
  _.forIn(_compare, (_floor, _floorName) => {
    _intersected[_floorName] = _.intersection(..._compare[_floorName]);
  });
  console.log(_intersected);

  // Final step to find grab all the ROOM info for all intersected ROOMs.
  let _emptyRoom = {};
  // Since we've already had the intersections, we can only take the first array.
  _.forIn(_result[0], (_floor, _floorName) => {
    // Make an object for each FLOOR.
    _emptyRoom[_floorName] = {};
    // Loop thru the intersections which consists of all ROOMs that have empty slots.
    _.forEach(_intersected[_floorName], (_room) => {
      // Grab ROOM info from the result value and save it to its corresponding location.
      _emptyRoom[_floorName][_room] = _floor.result[_room];
    })
  });

  return _emptyRoom;
}
// Find out intersections without ROOMs without SITE, FLOOR.
function _intersectionRoom(_result) {
  console.log('_intersectionRoom result: ', _result);
  // Grab and push all the keys of all empty ROOMs form all DATEs.
  let _compare = {};
  _.forEach(_result, (_date) => {
    let _dateResult = _date.result;
    _.forIn(_dateResult, (_site, _siteKey) => {
      let _sites = _dateResult[_siteKey];
      if (_.isEmpty(_compare[_siteKey])) {
        _compare[_siteKey] = {};
      }
      _.forIn(_sites, (_floor, _floorKey) => {
        if (_.isEmpty(_compare[_siteKey][_floorKey])) {
          _compare[_siteKey][_floorKey] = [];
        }
        _compare[_siteKey][_floorKey].push(_.keys(_sites[_floorKey]));
      });
    });
  });
  // Spread an array of array of keys from each DATE.
  let _intersected = {};
  _.forIn(_compare, (_site, _siteKey) => {
    if (_.isEmpty(_intersected[_siteKey])) {
      _intersected[_siteKey] = {};
    }
    _.forIn(_compare[_siteKey], (_floor, _floorKey) => {
      _intersected[_siteKey][_floorKey] = _.intersection(..._compare[_siteKey][_floorKey]);
    });
  });
  // Final step to find and grab all the ROOM info for all intersected ROOMs.
  let _emptyRoom = {};
  let _resultValue = _result[0].result;
  // Loop thru _intersected's SITE keys.
  _.forIn(_intersected, (_site, _siteKey) => {
    // Initialize with an object for each SITE's key if it's empty or undefined.
    if (_.isEmpty(_emptyRoom[_siteKey])) {
      _emptyRoom[_siteKey] = {};
    }
    // Then loop thru _intersected's FLOOR keys.
    _.forIn(_intersected[_siteKey], (_floor, _floorKey) => {
      // Initialize with an object for each FLOOR's key if it's empty or undefined.
      if (_.isEmpty(_emptyRoom[_siteKey][_floorKey])) {
        _emptyRoom[_siteKey][_floorKey] = {};
      }
      // Loop thru each intersected ROOM keys and grab the information from _resultValue.
      _.forEach(_intersected[_siteKey][_floorKey], (_room) => {
        _emptyRoom[_siteKey][_floorKey][_room] = _resultValue[_siteKey][_floorKey][_room];
      });
    });
  });

  // console.log(_compare);
  // console.log(_intersected);
  // console.log(_emptyRoom);

  return _emptyRoom;
}

// Drop empty ROOMs.
function _dropEmptyByFloor(_emptyRoom) {
  // If _emptyRoom is empty and still enters here, something must have gone wrong!
  // Throw an error to inform dev about this!
  if (_.isEmpty(_emptyRoom)) {
    console.error(_emptyRoom);
  }

  // Nothing is needed to be checked, just return _emptyRoom!
  return _emptyRoom;
}
// Drop empty FLOOR only.
function _dropEmptyBySite(_emptyRoom) {
  let _emptyRoomClean = {};

  _.forIn(_emptyRoom, (_floor, _floorKey) => {
    // Save only non-empty FLOORs.
    if (!_.isEmpty(_floor)) {
      _emptyRoomClean[_floorKey] = _floor;
    }
  });

  return _emptyRoomClean;
}
// Drop empty SITE and FLOOR.
function _dropEmpty(_emptyRoom) {
  let _emptyRoomTemp = {};
  let _emptyRoomClean = {};

  _.forIn(_emptyRoom, (_site, _siteKey) => {
    _emptyRoomTemp[_siteKey] = {};
    // Save only non-empty FLOORs.
    _.forIn(_emptyRoom[_siteKey], (_floor, _floorKey) => {
      if (!_.isEmpty(_floor)) {
        _emptyRoomTemp[_siteKey][_floorKey] = _floor;
      }
    });
    // Save only non-empty SITEs.
    // After omitting empty FLOORs.
    if (!_.isEmpty(_emptyRoomTemp[_siteKey])) {
      _emptyRoomClean[_siteKey] = _emptyRoomTemp[_siteKey];
    }
  });

  return _emptyRoomClean;
}

// Make all ROOMs at given SITE, FLOOR into arrays instead of objects.
// Additional feature to include SITE, FLOOR.
function _arrayliseRoomByFloor(_emptyRoomClean, _maskFloor, _maskSite) {
  let _arraylise = {}
  let _tempRoomArray = [];

  _arraylise[_maskSite] = {};

  _.forIn(_emptyRoomClean, (_roomInfo, _roomName) => {
    let _tempRoomInfo = _roomInfo;
    _tempRoomInfo['room'] = _roomName;
    _tempRoomArray.push(_tempRoomInfo);
  });
  _arraylise[_maskSite][_maskFloor] = _tempRoomArray;

  return _arraylise;
}
// Make all ROOMs at given SITE only into arrays instead of objects.
// Additional feature to include SITE.
function _arrayliseRoomBySite(_emptyRoomClean, _maskSite) {
  let _arraylise = {};

  _arraylise[_maskSite] = {};

  _.forIn(_emptyRoomClean, (_floor, _floorKey) => {
    let _tempRoomArray = [];
    _.forIn(_emptyRoomClean[_floorKey], (_roomInfo, _roomName) => {
      let _tempRoomInfo = _roomInfo;
      _tempRoomInfo['room'] = _roomName;
      _tempRoomArray.push(_tempRoomInfo);
    });
    _arraylise[_maskSite][_floorKey] = _tempRoomArray;
  });

  return _arraylise;
}
// Make all ROOMS at no given SITE, FLOOR into arrays instead of objects.
// Additional feature to include SITE, FLOOR.
function _arrayliseRoom(_emptyRoomClean) {
  let _arraylise = {};

  _.forIn(_emptyRoomClean, (_site, _siteKey) => {
    if (_.isEmpty(_arraylise[_siteKey])) {
      _arraylise[_siteKey] = {};
    }
    _.forIn(_emptyRoomClean[_siteKey], (_floor, _floorKey) => {
      let _tempRoomArray = [];
      _.forIn(_emptyRoomClean[_siteKey][_floorKey], (_roomInfo, _roomName) => {
        let _tempRoomInfo = _roomInfo;
        _tempRoomInfo['room'] = _roomName;
        _tempRoomArray.push(_tempRoomInfo);
      });
      _arraylise[_siteKey][_floorKey] = _tempRoomArray;
    });
  });

  return _arraylise;
}


module.exports = (_semafloorRef, _multipleFilteredDaysWithURL, _maskTimeDec, _maskTypesDec, _maskCapacityDec, _maskSite, _maskFloor, res) => {
  // var a = new Firebase('https://polymer-semaphore.firebaseio.com/mockMessages/2016/01february');
  // var _dates = [{ fulldate: '2016-02-01', week: 'week05' }, { fulldate: '2016-02-02', week: 'week05' }, { fulldate: '2016-02-03', week: 'week05' }, { fulldate: '2016-02-04', week: 'week05' }, { fulldate: '2016-02-05', week: 'week05' }, { fulldate: '2016-02-08', week: 'week06' }];
  // Masks.
  // var _maskTimeDec = parseInt('80000000', 16).toString(10);
  // var _maskTypesDec = parseInt('803', 16).toString(10);
  // var _maskCapacityDec = 4;
  // var _maskFloor = '01level';
  // var _maskSite = 'alpha';
  // var _maskFloor;
  // var _maskSite;
  // Dates' Promises.
  var _datesWithPromises = _multipleFilteredDaysWithURL.map(function(_d) {
    // let _childRef = [_d.weekNumber, _d.fulldate.slice(-2), 'site'].join('/');
    let _childRef = [_d.refURL, 'site'].join('/');
    // If SITE, FLOOR presents...
    _childRef = _.isUndefined(_maskSite) ? _childRef : [_childRef, _maskSite].join('/');
    _childRef = _.isUndefined(_maskFloor) ? _childRef : [_childRef, _maskFloor].join('/');
    let _eachRef = _semafloorRef.child(_childRef).once('value').then((snapshot) => {
      return {
        value: snapshot.val(),
        ref: _childRef
      };
    });
    return _eachRef;
  });
  
  // Promise.all
  Promise.all(_datesWithPromises).then((snapshot) => {
    let _filteredResult = [];
    // For each DATE, perform filtering.
    if (_maskFloor) {
      _filteredResult = _filterRoomByFloor(snapshot, _maskTimeDec, _maskTypesDec, _maskCapacityDec);
    }else if (_maskSite){
      _filteredResult = _filterRoomBySite(snapshot, _maskTimeDec, _maskTypesDec, _maskCapacityDec);
    }else {
      _filteredResult = _filterRoom(snapshot, _maskTimeDec, _maskTypesDec, _maskCapacityDec);
    }
  
    return _filteredResult;
  }).then((result) => {
    console.log('Filtered result: ', result);
    let _emptyRoom = {};
  
    // If result is empty, skip finding intersections.
    if (_.isEmpty(result)) {
      return _emptyRoom;
    }
  
    // For each DATE, find out intersection ROOMs.
    console.log('non-empty-proceed');
    if (_maskFloor) {
      _emptyRoom = _intersectionRoomByFloor(result);
    }else if (_maskSite){
      _emptyRoom = _intersectionRoomBySite(result);
    }else {
      _emptyRoom = _intersectionRoom(result);
    }
  
    return _emptyRoom;
  }).then((emptyRoom) => {
    // Further processing.
    console.log('emptyRoom: ', emptyRoom);
    let _emptyRoomClean = {};
  
    // If emptyRoom is empty, skip removing empty slots.
    if (_.isEmpty(emptyRoom)) {
      return _emptyRoomClean;
    }
  
    // Drop empty slots inside the emptyRoom.
    if (_maskFloor) {
      _emptyRoomClean = _dropEmptyByFloor(emptyRoom);
    }else if (_maskSite) {
      _emptyRoomClean = _dropEmptyBySite(emptyRoom);
    }else {
      _emptyRoomClean = _dropEmpty(emptyRoom);
    }
  
    return _emptyRoomClean;
  }).then((emptyRoomClean) => {
    // TODO: Make response that client can read.
    console.log('emptyRoomClean: ', emptyRoomClean);
    let _arraylise = {};
  
    if (_maskFloor) {
      _arraylise = _arrayliseRoomByFloor(emptyRoomClean, _maskFloor, _maskSite);
    }else if (_maskSite) {
      _arraylise = _arrayliseRoomBySite(emptyRoomClean, _maskSite);
    }else {
      _arraylise = _arrayliseRoom(emptyRoomClean);
    }
  
    console.log(_arraylise);
    
    // Send out as response with res object.
    console.log('_arraylise');
    res.send(_arraylise);
  }).catch((error) => {
    console.error(error);
  });
};


// For signal tower approach,
// (N-1)+(N-2)+(N-3)+(N-4)+(N-5)+(N-6)+(N-7) => N(N-n)/2, N = 8, n >= 1
// Say N = 8, total number of execution loop will be (8)(8-1)/2 = 56/2 = 28 #

// TODO: Create more random data to filter out if some days do not have empty room that meets the search criteria;
// exports.roomifyRead = (_emptyRoomsResult, _emptyRoomSiteMask, _emptyRoomFloorMask) => {
//   console.log('\n@@@ ############## Filtering... ################ ');
//   let roomifyRead = process.hrtime();
//   let _parted = [];
//   let _finalIntersectionResult = [];
//   let _finalFilteredResultWithRoomCount = {};
  
//   _emptyRoomsResult = _.sortBy(_emptyRoomsResult, 'fulldate');
//   // console.log(_emptyRoomsResult);
//   _parted = splitPartitionIntoGroups(partitionEmptyRooms(_emptyRoomsResult));
//   // console.log(_parted);
//   _finalIntersectionResult = findIntersection(_parted);
//   // console.log(_finalIntersectionResult);
//   _finalFilteredResultWithRoomCount = _filterResultBasedOnFloorAndSite(_finalIntersectionResult, _emptyRoomSiteMask, _emptyRoomFloorMask);
//   _finalFilteredResultWithRoomCount['totalEmptyRooms'] = _countTotalEmptyRooms(_finalFilteredResultWithRoomCount);
//   // console.log(_finalFilteredResultWithRoomCount);
//   let roomifyReadEnd = process.hrtime(roomifyRead);
//   console.log('\n3) Time elapsed in filtering results with room count:\t %dms', (roomifyReadEnd[0] * 1E3 + roomifyReadEnd[1] * 1E-6).toFixed(3));
//   // console.log(finalFilteredResultWithRoomCount);
//   return _finalFilteredResultWithRoomCount;
//   return _parted;
// };
