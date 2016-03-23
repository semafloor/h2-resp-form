// ###############
// dependencies...
const express = require('express');
// const https = require('https');
const https = require('spdy');
const morgan = require('morgan');
const fs = require('fs');
const compress = require('compression');
const cors = require('cors');
const _ = require('lodash');
const bodyParser = require('body-parser');
const Firebase = require('firebase');
const path = require('path');
const cronJob = require('cron').CronJob;
const momentTimezone = require('moment-timezone');
const gcm = require('node-gcm');

const computeTimeMask = require('./compute-time-mask');
const computeMultipleDays = require('./compute-multiple-days');
const computeWeekNumber = require('./compute-week-number');
const computeDayURL = require('./compute-day-url');
const roomifyRead = require('./roomify-read');
// const roomifyCreate = require('./roomify-create');
// const roomifyUpdate = require('./roomify-update');
// const roomifyDelete = require('./roomify-delete');
const _allLongMonthNames = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const _firebaseUsersRef = new Firebase('https://semafloor-webapp.firebaseio.com/users/google');

// #######################
// variables definition...
const port = process.env.PORT || 8443;
// const port = 443;
const addr = '0.0.0.0';
const app = express();
const options = {
  key: fs.readFileSync('/home/motss/live/privkey.pem'),
  cert: fs.readFileSync('/home/motss/live/fullchain.pem')
};
let fileRoot = path.resolve('.');

// Random notification payloads.
const _randomTitles =  [
  'you sucker',
  'lol',
  'haha',
  'Martin Lurther King VII',
  'It\'s already 2015',
  'Stop using frameworks',
  'No more HTTP, please use HTTPS or even better HTTP2'
];
const _randomBodies = [
  'haha',
  'Are you okay?',
  'random stuff',
  'Extravaganza',
  'Freaking stupid awesome!'
];
var _randomTitlesLen = _randomTitles.length;
var _randomBodiesLen = _randomBodies.length;
var _pushQueue = {};

// #################
// Express config...
app.use(compress());
app.options('*', cors());
app.use(morgan('short'));
// app.use(express.static(fileRoot));
// Express route-specific body-parsing...
const urlencodedParser = bodyParser.urlencoded({extended: false});

// #################
// Firebase setup...
// const semaforeRef = new Firebase('https://polymer-semaphore.firebaseio.com/mockMessages');

// #############################
// Bypass unrelated hostnames...
const onlyAllowedPages = (hostname) => hostname === 'secured' || hostname === 'semafore.motss.koding.io';

// ##################
// Express Routing...
// main URI...
app.get('/', (req, res) => {
  let _isAllowedHostname = onlyAllowedPages(req.hostname);

  if (_isAllowedHostname) {
    console.log('app.get');
    console.log(req);
    res.send(`<h1>Welcome to HTTP2 Express Server!</h1>`);

    console.log(`
    ${new Date()}
    Someone visted our HTTP2 Express server.`);
  }else {
    console.log('404');
    console.log(req);
    res.sendStatus(404);
  }
});

// app.get('/about', (req, res) => {
//   onlyAllowedPages(req.hostname, res);

//   res.send('<h2>About page</h2>');
//   console.log(`
//   ${new Date()}
//   Someone visted the About Page.`);
// });

// app.get('/:category/view', (req, res) => {
//   // res.sendStatus(404);
//   let root = fileRoot;
//   console.log(req.params);
//   // console.log(req.path);
//   // console.log(req.route);
//   // let path = req.path;
//   // path = path.split('/')[1];
//   // console.log(req.isSpdy);
//   // switch (path) {
//   //   case 'home':
//   //     console.log('HOME');
//   //     break;
//   //   case 'profile':
//   //     res.push('/var/www/semafloor-test-alpha/dist/bower_components/paper-toolbar/paper-toolbar.html',
//   //       { 'content-type': 'text/html, charset=UTF-8' }, (err, stream) => {
//   //         stream.end('console.log("hello from H2 push stream!");');
//   //       });
//   //     res.push('/var/www/semafloor-test-alpha/dist/bower_components/iron-collapse/iron-collapse.html',
//   //       { 'content-type': 'text/html, charset=UTF-8' }, (err, stream) => {
//   //         stream.end('console.log("hello from H2 push stream - iron-collapse!");');
//   //       });
//   //     console.log('PROFILE');
//   //   break;
//   //   case 'reserve':
//   //     console.log('RESERVE');
//   //   break;
//   //   case 'search':
//   //     console.log('SEARCH');
//   //   break;
//   //   case 'current':
//   //     console.log('CURRENT');
//   //   break;
//   //   case 'room':
//   //     console.log('ROOM');
//   //   break;
//   //   default:
//   //     console.error(`Error happened at ${path}.`);
//   // }

//   res.sendFile('index.html', { root });
// });

// /search/results URI...
app.post('/search/results', urlencodedParser, (req, res) => {
  console.log('\n\n@@@ ############## Start Here ################ ');
  console.log('\nSearching for available empty rooms... Please wait...');
  // Timers to measure JS execution.
  // let _searchDuration = process.hrtime();
  // let _promiseDuration = process.hrtime();
  // Firebase base href.
  const SEMAFLOORREF = new Firebase('https://polymer-semaphore.firebaseio.com/mockMessages');
  // Cache request body.
  let _reqBody = req.body;
  // Compute multiple dates array.
  let _multipleDays = computeMultipleDays(_reqBody.startDate, _reqBody.endDate);
  // Compute multiple dates array with week number.
  let _multipleFilteredDaysWithWeekNumber = computeWeekNumber(_multipleDays);
  // Compute multiple dates array with URL.
  let _multipleFilteredDaysWithURL = computeDayURL(_multipleFilteredDaysWithWeekNumber);
  // Initialize multiple dates array with Promises.
  // let _multipleFilteredDaysWithPromise = [];

  // Compute request bodies into corresponding masks.
  // Compute TIME mask.
  let _maskTimeDec = computeTimeMask(_reqBody.tStart, _reqBody.tEnd);
  // Compute TYPES mask.
  let _maskTypesDec = _.isEmpty(_reqBody.types) ? 0 : parseInt(_reqBody.types, 16).toString(10);
  // Compute Capacity mask.
  let _maskCapacityDec = (_reqBody.capacity || 1);
  // Compute SITE mask.
  let _maskSite = _reqBody.site;
  // Compute FLOOR mask.
  let _maskFloor = _reqBody.floor;

  // Compute today's month's ref.
  let _today = new Date();
  let _yearChildRef = new Date().getFullYear();
  let _monthChildRef = `00${_today.getMonth()}`.slice(-2) + _allLongMonthNames[_today.getMonth()];
  let _combinedRef = [_yearChildRef, _monthChildRef, 'queryHistory'].join('/');
  // Save request history into Firebase.
  SEMAFLOORREF.child(_combinedRef).push({
    timestamp: Firebase.ServerValue.TIMESTAMP,
    date: _today.toString(),
    query: _reqBody
  });
  // Passed in all arguments into roomifyRead API.
  roomifyRead(SEMAFLOORREF, _multipleFilteredDaysWithURL, _maskTimeDec, _maskTypesDec, _maskCapacityDec, _maskSite, _maskFloor, res);
});

// ############ Semafloor's Push Notification ############
app.get('/notification-data.json/:email', (req, res) => {
  let _randomTitleIdx = Math.floor(Math.random() * _randomTitlesLen);
  let _randomBodyIdx = Math.floor(Math.random() * _randomBodiesLen);
  let _randomTag = (Math.random() * 1000) + '-you-sucker-random-tag';
  let _emailParams = req.params.email;

  console.log('\nsending push notification...');
  console.log(_randomTitles[_randomTitleIdx], _randomBodies[_randomBodyIdx], _randomTag);
  console.log(req.headers, req.params.email);

  // Check for existing email in the push queue.
  if (_.isUndefined(_pushQueue[_emailParams])) {
    // TODO: For debugging purpose. To be removed.
    res.json({
      'title': _randomTitles[_randomTitleIdx],
      'message': _randomBodies[_randomBodyIdx],
      'icon': 'https://www.semafloor.com/images/touch/chrome-touch-icon-192x192.png',
      'tag': _randomTag
    });
    // return;
  }else {
    let _timeLeft = _pushQueue[_emailParams].timeLeft;
    let _message = _timeLeft > 0 ? `Your next meeting in ${_timeLeft} minutes.` : `You have a meeting now.`;
    let _tag = encodeURIComponent(momentTimezone(new Date()).tz('Asia/Singapore').format('YYYY-MM-DD_hh:mm:ss_reminder_tag'));

    res.json({
      'title': 'Reservation reminder',
      'message': _message,
      'icon': 'https://www.semafloor.com/images/touch/chrome-touch-icon-192x192.png',
      'tag': _tag
    });
  }
});

// ############## Experimenting CronJob for Node ############

// var CronJob = require('cron').CronJob;
// var job = new CronJob({
//   cronTime: '00 30 11 * * 1-5',
//   onTick: function() {
//     /*
//     * Runs every weekday (Monday through Friday)
//     * at 11:30:00 AM. It does not run on Saturday
//     * or Sunday.
//     */
//   },
//   start: false,
//   timeZone: 'America/Los_Angeles'
// });
// job.start();

// Seconds: 0-59
// Minutes: 0-59
// Hours: 0-23
// Day of Month: 1-31
// Months: 0-11
// Day of Week: 0-6

// var gcm = require('node-gcm');

// // Create a message
// // ... with default values
// var message = new gcm.Message();

// // ... or some given values
// var message = new gcm.Message({
//     collapseKey: 'demo',
//     priority: 'high',
//     contentAvailable: true,
//     delayWhileIdle: true,
//     timeToLive: 3,
//     restrictedPackageName: "somePackageName",
//     dryRun: true,
//     data: {
//         key1: 'message1',
//         key2: 'message2'
//     },
//     notification: {
//         title: "Hello, World",
//         icon: "ic_launcher",
//         body: "This is a notification that will be displayed ASAP."
//     }
// });

// // Change the message data
// // ... as key-value
// message.addData('key1','message1');
// message.addData('key2','message2');

// // ... or as a data object (overwrites previous data object)
// message.addData({
//     key1: 'message1',
//     key2: 'message2'
// });

// // Set up the sender with you API key
// var sender = new gcm.Sender('insert Google Server API Key here');

// // Add the registration tokens of the devices you want to send to
// var registrationTokens = [];
// registrationTokens.push('regToken1');
// registrationTokens.push('regToken2');

// // Send the message
// // ... trying only once
// sender.sendNoRetry(message, { registrationTokens: registrationTokens }, function(err, response) {
//   if(err) console.error(err);
//   else    console.log(response);
// });

// // ... or retrying
// sender.send(message, { registrationTokens: registrationTokens }, function (err, response) {
//   if(err) console.error(err);
//   else    console.log(response);
// });

// // ... or retrying a specific number of times (10)
// sender.send(message, { registrationTokens: registrationTokens }, 10, function (err, response) {
//   if(err) console.error(err);
//   else    console.log(response);
// });

var _message = new gcm.Message({
  priority: 'high',
  contentAvailable: true,
  delayWhileIdle: true,
});

var _sender = new gcm.Sender(process.env.API_KEY);

// Cached Lodash's methods.
var _forIn = _.forIn;
var _isEmpty = _.isEmpty;
var _values = _.values;

var _pushUpcoming = new cronJob({
  cronTime: '0 0-59/1 0-23/1 * * 1-5',
  onTick: _ => {
    var _nowTime = momentTimezone(new Date()).tz('Asia/Singapore');
    console.log(`\ncronJob running at ${_nowTime.format('ddd, YYYY-MM-DD hh:mm:ss:SSSSA Z')}`);

    // For every 15 seconds, traverse all users' Firebase
    // Filter those users who have subscriptions for push notification.
    _firebaseUsersRef.once('value').then((_snapshot) => {
      let _allUsers = [];
      // console.log(_snapshot.val());
      _snapshot.forEach((_n) => {
        let _hasPushSubscription = _n.child('pushSubscription').exists();
        let _hasReservations = _n.child('reservations').exists();
        // Only when user has push subscribed and upcoming reservations...
        if (_hasPushSubscription && _hasReservations) {
          _allUsers.push({
            'uid': _n.key(),
            'email': _n.val().email,
            'sid': _n.val().pushSubscription,
            'reservations': _n.val().reservations
          });
        }
      });
      return _allUsers;
    }).then((_allUsers) => {
      let _allUsersLen = _allUsers.length;
      // let _randomTitleIdx = Math.floor(Math.random() * _randomTitlesLen);
      // let _randomBodyIdx = Math.floor(Math.random() * _randomBodiesLen);
      let _registrationTokens = [];
      // Working on filtered users to start traversing their reservations
      // to lookup for any reservations that will due in 15 mins.
      for (let i = 0; i < _allUsersLen; i++) {
        // console.log(_allUsers[i]);
        let _email = encodeURIComponent(_allUsers[i].email);
        let _uid = _allUsers[i].uid;
        let _sid = _values(_allUsers[i].pushSubscription);
        let _sidLen = _sid.length;
        let _reservations = _allUsers[i].reservations;
        let _nowFifteen = _nowTime.format('HH:mm');
        let _nextFifteen = _nowTime.add(15, 'm').format('HH:mm');
        // Traverse every reservations of _allUsers[i].
        _forIn(_reservations, (r, idx) => {
          // When fromTime is in between now and the next 15 mins...
          // By default, each reservations has min 30mins, starts from 00.
console.log(i, idx, r.fromTime, _nowFifteen, _nextFifteen, r.fromTime >= _nowFifteen && r.fromTime <= _nextFifteen);
          if (r.fromTime >= _nowFifteen && r.fromTime <= _nextFifteen) {
            let _fromTimeMin = parseFloat(r.fromTime.slice(-2));
            let _nowFifteenMin = parseFloat(_nowFifteen.slice(-2));
            let _timeLeft = Math.abs(_fromTimeMin - _nowFifteenMin);
            _timeLeft = _timeLeft >= 15 ? 15 : 0;
            // Push to queue which will be going to be used by incoming
            // request from subscribed device/ browser for validation.
            _pushQueue[_email] = {
              uid: _uid,
              sid: _sid,
              reservations: _reservations,
              timeLeft: _timeLeft
            };

            // Push every subscription id.
            for (let i = 0; i < _sidLen; i++) {
              // TODO: _registrationTokens is still empty even though it's true.
              _registrationTokens.push(_sid[i]);
            }
          }
        });
      }

      console.log(`\n`);
      return _registrationTokens;
    }).then((_registrationTokens) => {
      // Do nothing if _registrationTokens is empty...
      console.log('_registrationTokens:', _registrationTokens);
      if (!_isEmpty(_registrationTokens)) {
        _message.addNotification({
          title: 'you sucker',
          body: 'haha',
          message: 'lol'
        });
        _message.addData({
          title: 'you sucker',
          body: 'haha',
          message: 'lol'
        });
        // console.log('_message:', _message);

        _sender.send(_message, { registrationTokens: _registrationTokens }, (err, res) => {
          if (err) console.error(err);
          else console.log('\n_sender res:', res);
        });
      }
    }).catch((error) => {
      console.error(error);
    });
  },
  onComplete: _ => {
    // This method only runs when stop() is called.
    // _pushUpcoming.stop();
    console.log(`cronJob completed at ${momentTimezone(new Date()).tz('Asia/Singapore').format('ddd, YYYY-MM-DD hh:mm:ss:SSSSA Z')}`);
  },
  start: !1,
  timeZone: 'Asia/Singapore'
});
_pushUpcoming.start();

// #########################
// HTTPS server for Express.
const server = https.createServer(options, app);
server.listen(port, addr, (err) => {
  // if (err) console.log(err);
  // let uid = parseInt(process.env.SUDO_UID);
  // if (uid) process.setuid(uid);
  // console.log('Server\'s UID is now ' + process.getuid());

  console.log(server.address());
  let host = server.address().address;
  let port = server.address().port;
  console.log(`HTTPS Express server started on https://${host}:${port}.`);
});