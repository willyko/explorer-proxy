const https = require('https'),
  fs = require('fs'),
  httpProxy = require('http-proxy');
const config = require('./config');
let ssl;
try {
  ssl = {
    key: fs.readFileSync('/etc/letsencrypt/live/blockchainfoundry.co/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/blockchainfoundry.co/fullchain.pem', 'utf8')
  };
} catch (e) {
  console.log('ssl error', e);
}
var enableCors = function(req, res) {
  if (req.headers['access-control-request-method']) {
    res.setHeader('access-control-allow-methods', req.headers['access-control-request-method']);
  }

  if (req.headers['access-control-request-headers']) {
    res.setHeader('access-control-allow-headers', req.headers['access-control-request-headers']);
  }

  if (req.headers.origin) {
    res.setHeader('access-control-allow-origin', req.headers.origin);
    res.setHeader('access-control-allow-credentials', 'true');
  }
};


function parseHeaders(req) {
  let host;
  try {
    host = req.headers.host.split(':')[0];
    console.log('URL: ', req.url, host);
  } catch (e) {
    console.log('Error parsing:', req.headers);
  }

  return host;
}

function parseHeaders(req) {
  let host;
  try {
    host = req.headers.host.split(':')[0];
    console.log('URL: ', req.url, host);
  } catch (e) {
    console.log('Error parsing:', req.headers);
  }

  return host;
}

function getHostEntry(host) {
  let  hostEntry = Object.keys(config.hosts).find(hostKey => hostKey === host);
  hostEntry = hostEntry ? config.hosts[hostEntry] : null;
  return hostEntry;
}

//proxy
const proxy = httpProxy.createProxyServer({});

// set header for CORS
proxy.on("proxyRes", function(proxyRes, req, res) {
  enableCors(req, proxyRes);
});

//main server
const server = https.createServer( ssl, function(req, res) {
  const host = parseHeaders(req);
  let  hostEntry = getHostEntry(host);
  if (hostEntry && hostEntry.http) {
    console.log(`  > Routing to request to  ${hostEntry.http}`);
    if (req.method === 'OPTIONS') {
      enableCors(req, res);
      res.writeHead(200);
      res.end();
      return;
    }
    proxy.web(req, res, {
      target: {
        host: 'localhost',
        port: hostEntry.http
      }
    }, (e) => {
      console.log('proxy error', e);
    });
  } else {
    console.log(`  > No hostKey found for ${host} or host has no http entry`);
  }
});

server.on('upgrade',function(req, socket, head){
  const host = parseHeaders(req);
  const  hostEntry = getHostEntry(host);
  if (hostEntry && hostEntry.ws) {
    console.log('  > upgrade websocket ', host);
    proxy.ws(req, socket, head, { target: { host: 'localhost', port: hostEntry.ws, secure: hostEntry.secure ? hostEntry.secure : false }});
  } else {
    console.log(`  > No websocket hostKey found for ${host} or host has no ws entry`);
  }

  socket.on('werror', err => {
    console.error(err); // ECONNRESET will be caught here
  });
});



console.log(`listening on port ${config.port}`);
server.listen(config.port);
