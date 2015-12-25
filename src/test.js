var Fireproof = require('fireproof');
var Firebase = require('firebase');
var _ = require('lodash');

var multipleDays = [
  '2015-05-01', '2015-05-02', '2015-05-03', '2015-05-04', '2015-05-05',
  '2015-05-06', '2015-05-07', '2015-05-08', '2015-05-09', '2015-05-10',
  '2015-05-11', '2015-05-12', '2015-05-13', '2015-05-14', '2015-05-15',
  '2015-05-16', '2015-05-17', '2015-05-18', '2015-05-19', '2015-05-20',
  '2015-05-21', '2015-05-22', '2015-05-23', '2015-05-24', '2015-05-25',
  '2015-05-26', '2015-05-27', '2015-05-28', '2015-05-29', '2015-05-30',
  '2015-05-31'
];

var getWeekNumber = function (_fulldate) {
  var _now = new Date(_fulldate);
  var _onejan = new Date(_now.getFullYear(), 0, 1);
  return Math.ceil((((_now - _onejan) / 86400000) + _onejan.getDay() + 1) / 7);
};

var filterMultipleDays = function (_multipleDays) {
  return _multipleDays.filter(function (day) {
    var _newDate = new Date(day);
    return _newDate.getDay() > 0 && _newDate.getDay() < 6;
  });
};

var url = 'https://polymer-semaphore.firebaseio.com/mockMessages';
var firebaseRef = new Firebase(url);
var semafloorRef = new Fireproof(firebaseRef);
    
var logElapseTime = function (_endLabel) {
  try {
    if (_endLabel) {
      return process.hrtime(_endLabel);
    }
    return process.hrtime();
  }catch (e) {
    return window.performance.now();
  }
};

var haha = logElapseTime();
// Sync Approach;
console.log('Running sync task...\n');
semafloorRef.child('2015/04may/week18/01/site').once('value', function (snapshot) {
  if (snapshot) {
    var hahaEnd = logElapseTime(haha);
    console.log('\n1) Time spent on sync: %dms', _.isArray(hahaEnd) ? (hahaEnd[0] * 1E3 + hahaEnd[1] * 1E-6).toFixed(3) : (hahaEnd - haha));
  }
});
var haha2 = logElapseTime();
semafloorRef.child('2015/04may/week19/05/site').once('value', function (snapshot) {
  if (snapshot) {
    var hahaEnd2 = logElapseTime(haha2);
    console.log('\n2) Time spent on sync 2: %dms', _.isArray(hahaEnd2) ? (hahaEnd2[0] * 1E3 + hahaEnd2[1] * 1E-6).toFixed(3) : (hahaEnd2 - haha2));
  }
});

console.log('Separator...\n');

// Async approach using ES2015's Promise;
var lol = logElapseTime();
console.log('Running async task...\n');
var _p1 = new Promise(function (resolve, reject) {
  semafloorRef.child('2015/04may/week18/01/site').once('value', function (snapshot) {
    resolve(snapshot);
  });
});

var _p2 = new Promise(function (resolve, reject) {
  semafloorRef.child('2015/04may/week19/05/site').once('value', function (snapshot) {
    resolve(snapshot);
  });
});

Promise.all([_p1, _p2]).then(function (value) {
  if (value) {
    var lolEnd = logElapseTime(lol);
    console.log('\n3) Time spent on async: %dms', _.isArray(lolEnd) ? (lolEnd[0] * 1E3 + lolEnd[1] * 1E-6).toFixed(3) : (lolEnd - lol));
  }
});

var successiveIdx = 4;
setInterval(function () {
  console.log('\n\n#############################');
  console.log('Successive Separator...\n');
  var successive = logElapseTime();
  console.log('Running successive async tasks...');
  var _p3 = new Promise(function (resolve, reject) {
    semafloorRef.child('2015/04may/week18/06/site').once('value', function (snapshot) {
      resolve(snapshot);
    });
  });

  var _p4 = new Promise(function (resolve, reject) {
    semafloorRef.child('2015/04may/week19/07/site').once('value', function (snapshot) {
      resolve(snapshot);
    });
  });

  Promise.all([_p4, _p3]).then(function (value) {
    if (value) {
      var successiveEnd = logElapseTime(successive);
      console.log('\n%d) Time spent on successive async: %dms', successiveIdx, _.isArray(successiveEnd) ? (successiveEnd[0] * 1E3 + successiveEnd[1] * 1E-6).toFixed(3) : (successiveEnd - successive));
    }
  });
  
  successiveIdx++;
}, 1000);
