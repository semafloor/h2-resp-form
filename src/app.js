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
// app.use(express.static(fileRoot));
// Express route-specific body-parsing...
const urlencodedParser = bodyParser.urlencoded({extended: false});

// #################
// Firebase setup...
// const semaforeRef = new Firebase('https://polymer-semaphore.firebaseio.com/mockMessages');

// #############################
// Bypass unrelated hostnames...
const onlyAllowedPages = (hostname) => hostname !== 'secured' && hostname !== 'semafore.motss.koding.io';

// ##################
// Express Routing...
// main URI...
app.get('/', (req, res) => {
  let _isAllowHostname = onlyAllowedPages(req.hostname);
  
  if (_isAllowHostname) {
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
  
  // Passed in all arguments into roomifyRead API.
  roomifyRead(SEMAFLOORREF, _multipleFilteredDaysWithURL, _maskTimeDec, _maskTypesDec, _maskCapacityDec, _maskSite, _maskFloor, res);
  
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