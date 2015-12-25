// curl -k https://localhost:8000/
// var https = require('http2');
var https = require('spdy');
// var https = require('https');
var http = require('http');
var fs = require('fs');
var _ = require('lodash');
var morgan = require('morgan');
var express = require('express');
var app = express();

// log incoming network request.
app.use(morgan('short'));

// load our js files and certificate files we just generated.
var lodash = fs.readFileSync('lodash.min.js');
var main = fs.readFileSync('main.js');

// var options = {
//   key: fs.readFileSync('key.pem'),
//   cert: fs.readFileSync('cert.pem')
// };
// var options = {
//   key: fs.readFileSync('/etc/letsencrypt/live/semafloor.com/privkey.pem'),
//   cert: fs.readFileSync('/etc/letsencrypt/live/semafloor.com/fullchain.pem')
// };
var options = {
  key: fs.readFileSync('/home/motss/live/privkey.pem'),
  cert: fs.readFileSync('/home/motss/live/fullchain.pem')
};

var httpPort = process.env.PORT || 9000;
var port = process.env.PORT || 8443;
var kodingAddr = '0.0.0.0';

// #################################################
// Simple SPDY server + server push + HTTP Redirect.
// var express = require('express');
// var app = express();
// var httpApp = express();

// httpApp.get('*', function (req, res) {
//   // res.redirect('https://' + req.hostname + ':9000' + 'req.path');
//   console.log('hostname:' + req.hostname);
//   console.log('ip: ' + req.ip);
//   console.log('ips: ' + req.ips);
//   console.log('oriURL: ' + req.originalUrl);
//   console.log('baseURL: ' + req.baseUrl);
//   console.log('host: ' + req.headers.host);
//   console.log('path: ' + req.path);
//   console.log('\n');
//   if (req.hostname === 'semafore.motss.koding.io' || req.hostname === 'localhost') {
//     // res.redirect('https://'+ req.hostname + req.path);  
//     // res.redirect('https://semafore.motss.koding.io' + req.path);  
//     // res.redirect('https://semafloor.com');
//     console.log(req.hostname + '\n');
//   }else {
//     console.log('####################');
//     console.log(req.hostname + '\n');
//     // res.end(req.hostname);
//   }
// });
// http.createServer(httpApp).listen(httpPort, function () {
//   console.log('Express HTTP server started on port ' + httpPort + '.');
// });

// var server = https.createServer(options, function (req, res) {
//   var headers = {'content-type': 'application/javascript'};
//   console.log('https first', req.headers.host);
  
//   res.push('/lodash.min.js', headers, function (err, stream) {
//     console.log('pushing lodash');
//     if (err) {
//       console.error(err);
//       return;
//     }
//     stream.end(lodash);
//   });
//   res.push('/main.js', headers, function (err, stream) {
//     console.log('pushing main');
//     if (err) {
//       console.error(err);
//       return;
//     }
//     stream.end(main);
//   });
//   res.writeHead(200, {'content-type': 'text/html'});
//   var message = 'No SPDY for you!';
//   if (req.isSpdy) {
//     message = 'YAY! SPDY Works!';
//   }
//   res.write('<script src="/main.js"></script>');
//   res.write('<script src="/lodash.min.js"></script>');
//   res.end('<h1>Welcome to SPDY World with server push!</h1>');
// });
// server.listen(8443, function () {
//   // console.log('Express SPDY server started on port ' + port + '.');
//   console.log('Express SPDY server started on port ' + 8443 + '.');
// });

// ################################
// Simple SPDY server + server push.
// var server = https.createServer(options, function (req, res) {
  // METHOD 1.
  // var stream = res.push('/main.js', {
  //   request : {
  //     accept: '*/*'
  //   },
  //   response: {
  //     'content-type': 'application/javascript'
  //   }
  // });
  //
  // stream.on('error', function (err) {
  //   console.error(err);
  // });
  // stream.end('alert("hello from push stream!");');
  // res.writeHead(200);
  // res.write('<script src="/main.js"></script>');
  // res.end('<h1>Hello SPDY World!</h1>');

// METHOD 2.
// var pushServer = https.createServer(options, function (req, res) {
//   var headers = {
//     'content-type': 'application/javascript'
//   };

//   res.push('/lodash.min.js', headers, function (err, stream) {
//       if (err) {
//         console.error(err);
//         return;
//       }

//       stream.end(lodash);
//   });

//   res.push('/main.js', headers, function (err, stream) {
//     if (err) {
//       console.error(err);
//       return;
//     }

//     stream.end(main);
//   });

//   res.writeHead(200, {'content-type': 'text/html'});

//   var message = 'No SPDY for you!';

//   if (req.isSpdy) {
//     message = 'YAY! SPDY Works!';
//   }

//   res.write('<script src="/main.js"></script>');
//   res.write('<script src="/lodash.min.js"></script>');
//   res.end('<h1>Welcome to SPDY World with server push!</h1>');
//   console.log('Someone visited our push Server!\n');
// });

// pushServer.listen(port, function () {
//   console.log(pushServer.address());
//   var pushHost = pushServer.address().address;
//   var pushPort = pushServer.address().port;
//   console.log('SPDY Server started on ' + pushHost + ':' + pushPort + ' and excitingly with server push capability! Enjoy!');
// });

// ####################
// Simple HTTPS server.
// var serverSecured = https.createServer(options, function (req, res) {
//   res.writeHead(200);
//   res.end('<h1>Hello world!<br/>Welcome To HTTP2 bandwagon!</h1>');
//   console.log('Someone visited our HTTP2 Server!\n');
// });

// serverSecured.listen(port, function () {
//   console.log(serverSecured.address());
//   var hostSecured = serverSecured.address().address;
//   var portSecured = serverSecured.address().port;
  
//   console.log('Example app listening at https://%s:%s', hostSecured, portSecured);
// });

// ######################
// Simple Express Server.
// var express = require('express');
// var app = express();

// app.get('/', function (req, res) {
//   res.send('Hello World!\n');
//   console.log('Someone visited our web server!\n');
// });

// var server = app.listen(httpPort, function () {
//   console.log(server.address());
//   var host = server.address().address;
//   var port = server.address().port;

//   console.log('Example app listening at http://%s:%s', host, port);
// });

// ##################
// Simple HTTP Server
// var server = http.createServer(function (req, res) {
//   res.end('Hello from NodeJS!\n');
//   console.log('Someone visited our web server!\n');
// });

// server.listen(httpPort, kodingAddr, function() {
//   console.log('NodeJS web server running on ' + kodingAddr + ':' + httpPort + '.');
// });

// ####################################
// Express server with SPDY server push
// var express = require('express');
// var app = express();

// app.get('/', function(req, res) {
//   var message = 'SPDY works for you!';
//   if (req.isSpdy) {
//     try {
//       res.push('/lodash.min.js', {'content-type': 'application/javascript'}, function(err, stream){
//         if (err) {console.log('Error happens when pushing lodash.min.js\n');console.log(err); return;}
//         else {stream.end(lodash)}
//       });
//       res.push('/main.js', {'content-type': 'application/javascript'}, function(err, stream){
//         if (err) {console.log('Error happens when pushing main.js\n');console.log(err); return;}
//         else {stream.end(main)}
//       });
//     }catch(err) {
//       console.log('Error pushing file');
//     }
    
//     res.write('<script src="/lodash.min.js"></script>');
//     res.write('<script src="/main.js"></script>');
//   }else {
//     message = 'No SPDY for you';
//   }
//   res.write('<h1>SPDY push with Express</h1>');
//   res.end('<h2>' + message + '</h2>');
//   console.log('Someone visited the spdy server with express');
// });

// var expressPush = https.createServer(options, app);

// expressPush.listen(443, function(){
//   console.log(expressPush.address());
//   var expressHost = expressPush.address().address;
//   var expressPort = expressPush.address().port;
//   console.log('Express SPDY server with server push started on https://' + expressHost + ':' + expressPort + '.');
// });

// ##################################
// Express server with HTTPS/2.
app.get('/', function(req, res) {
  if (req.hostname !== 'secured' && req.hostname !== 'semafore.motss.koding.io') {
    res.sendStatus(404);
    return;
  }
  console.log(req.isSpdy);
  res.end('<h1>Welcome to HTTPS/2 Express world!</h1>');
  console.log(new Date() + ': Someone visited your server from ' + req.hostname + '!\n');
});

var server = https.createServer(options, app);

server.listen(port, function() {
  console.log(server.address());
  var host = server.address().address;
  var port = server.address().port;
  console.log('HTTPS Express server started on https://' + host + ':' + port + '.');
});