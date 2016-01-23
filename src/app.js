// ###############
// dependencies...
const express = require('express');
const https = require('https');
const morgan = require('morgan');
const fs = require('fs');
const compress = require('compression');
const cors = require('cors');
const _ = require('lodash');
const bodyParser = require('body-parser');
const Firebase = require('firebase');
const path = require('path');

const computeTimeMask = require('./compute-time-mask');
const computeMultipleDays = require('./compute-multiple-days');
const computeWeekNumber = require('./compute-week-number');
const computeDayURL = require('./compute-day-url');
const roomifyRead = require('./roomify-read');
// const roomifyCreate = require('./roomify-create');
// const roomifyUpdate = require('./roomify-update');
// const roomifyDelete = require('./roomify-delete');

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

// #################
// Express config...
app.use(compress());
app.options('*', cors());
app.use(morgan('short'));
app.use(express.static(fileRoot));
// Express route-specific body-parsing...
const urlencodedParser = bodyParser.urlencoded({extended: false});

// #################
// Firebase setup...
// const semaforeRef = new Firebase('https://polymer-semaphore.firebaseio.com/mockMessages');

// #############################
// Bypass unrelated hostnames...
const onlyAllowedPages = (hostname, res) => {
  if (hostname !== 'secured' && hostname !== 'semafore.motss.koding.io') {
    res.sendStatus(404);
    return;
  }
};

// ##################
// Express Routing...
// main URI...
app.get('/', (req, res) => {
  onlyAllowedPages(req.hostname, res);
  res.send(`<h1>Welcome to HTTP2 Express Server!</h1>`);

  console.log(`
  ${new Date()}
  Someone visted our HTTP2 Express server.`);
});

// app.get('/about', (req, res) => {
//   onlyAllowedPages(req.hostname, res);

//   res.send('<h2>About page</h2>');
//   console.log(`
//   ${new Date()}
//   Someone visted the About Page.`);
// });

app.get('/:category/view', (req, res) => {
  // res.sendStatus(404);
  let root = fileRoot;
  console.log(req.params);
  // console.log(req.path);
  // console.log(req.route);
  // let path = req.path;
  // path = path.split('/')[1];
  // console.log(req.isSpdy);
  // switch (path) {
  //   case 'home':
  //     console.log('HOME');
  //     break;
  //   case 'profile':
  //     res.push('/var/www/semafloor-test-alpha/dist/bower_components/paper-toolbar/paper-toolbar.html',
  //       { 'content-type': 'text/html, charset=UTF-8' }, (err, stream) => {
  //         stream.end('console.log("hello from H2 push stream!");');
  //       });
  //     res.push('/var/www/semafloor-test-alpha/dist/bower_components/iron-collapse/iron-collapse.html',
  //       { 'content-type': 'text/html, charset=UTF-8' }, (err, stream) => {
  //         stream.end('console.log("hello from H2 push stream - iron-collapse!");');
  //       });
  //     console.log('PROFILE');
  //   break;
  //   case 'reserve':
  //     console.log('RESERVE');
  //   break;
  //   case 'search':
  //     console.log('SEARCH');
  //   break;
  //   case 'current':
  //     console.log('CURRENT');
  //   break;
  //   case 'room':
  //     console.log('ROOM');
  //   break;
  //   default:
  //     console.error(`Error happened at ${path}.`);
  // }

  res.sendFile('index.html', { root });
});

// /search/results URI...
app.post('/search/results', urlencodedParser, (req, res) => {
  console.log('\n\n@@@ ############## Start Here ################ ');
  console.log('\nSearching for available empty rooms... Please wait...');
  let _searchDuration = process.hrtime();
  let _promiseDuration = process.hrtime();
  // required variables;
  const SEMAFLOORREF = new Firebase('https://polymer-semaphore.firebaseio.com/mockMessages');
  let _reqBody = req.body;
  let _multipleDays = computeMultipleDays(_reqBody.startDate, _reqBody.endDate);
  let _multipleFilteredDaysWithWeekNumber = computeWeekNumber(_multipleDays);
  let _multipleFilteredDaysWithURL = computeDayURL(_multipleFilteredDaysWithWeekNumber);
  let _multipleFilteredDaysWithPromise = [];
  // request body => mask;
  let _emptyRoomTimeMask = computeTimeMask(_reqBody.tStart, _reqBody.tEnd);
  let _emptyRoomTypesMask = _.isEmpty(_reqBody.types) ? 0 : parseInt(_reqBody.types, 16).toString(10);
  let _emptyRoomCapacityMask = (_reqBody.capacity || 1);
  let _emptyRoomSiteMask = _reqBody.site;
  let _emptyRoomFloorMask = _reqBody.floor;
  // setting up Promise(s);
  _multipleFilteredDaysWithPromise = _multipleFilteredDaysWithURL.map((_day) => {
    return new Promise(function (_resolve, _reject) {
      try {
        SEMAFLOORREF.child(_day.refURL + '/site').orderByKey().once('value', function (snapshot) {
          _resolve(roomifyRead.findEmptyRoom(snapshot, _day.refURL, _day.fulldate, _emptyRoomCapacityMask, _emptyRoomTimeMask, _emptyRoomTypesMask));
        });
      } catch (err) {
        err ? _reject (err) : _reject(_day.refURL);
      }
    });
  });
  let _promiseDurationEnd = process.hrtime(_promiseDuration);
  console.log('\n1) Total elapsed time in setting up Promise(s):\t %dms', (_promiseDurationEnd[0] * 1E3 + _promiseDurationEnd[1] * 1E-6).toFixed(3));

  Promise.all(_multipleFilteredDaysWithPromise).then((value) => {
    // console.log(_.sortBy(value, 'fulldate'));
    if (_.isEmpty(value)) {
      let _searchDurationEnd = process.hrtime(_searchDuration);
      console.log('Search date(s) is(are) either weekends or holiday!');
      console.log('\n2) Total elapsed time in getting result from Firebase:\t %dms', (_searchDurationEnd[0] * 1E3 + _searchDurationEnd[1] * 1E-6).toFixed(3));
      res.send(`<h1>Sorry, empty room(s) not found! <br/>Please search again!</h1>`);
    }else {
      let _searchDurationEnd = process.hrtime(_searchDuration);
      console.log('\n2) Total elapsed time in getting result from Firebase:\t %dms', (_searchDurationEnd[0] * 1E3 + _searchDurationEnd[1] * 1E-6).toFixed(3));
      let _filterDuration = process.hrtime();
      let _emptyRoomsResult = _.sortBy(value, 'fulldate');
      _emptyRoomsResult = roomifyRead.roomifyRead(_emptyRoomsResult, _emptyRoomSiteMask, _emptyRoomFloorMask);
      if (_emptyRoomsResult.totalEmptyRooms === 0) {
        console.log('Empty room(s) not found!');
      }else {
        console.log('Empty room(s) found!');
      }
      let _filterDurationEnd = process.hrtime(_filterDuration);
      console.log('\n4) Total elapsed time of whole process:\t %dms', (_filterDurationEnd[0] * 1E3 + _filterDurationEnd[1] * 1E-6).toFixed(3));
      return _emptyRoomsResult;
    }
  }).then((value) => {
    res.send(value);
  }).catch(function (reason) {
    console.log('Error: ');
    console.log(reason);
  });
});

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