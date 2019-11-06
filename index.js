const https = require('https'),
  fs = require('fs'),
  httpProxy = require('http-proxy');
const config = require('./config');
let ssl;
try {
  ssl = {
    key: fs.readFileSync('/etc/letsencrypt/live/explorer.blockchainfoundry.co/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/explorer.blockchainfoundry.co/fullchain.pem', 'utf8')
  };
} catch (e) {
  console.log('ssl error', e);
}

//proxy
const proxy = httpProxy.createProxyServer({});

//main server
const server = https.createServer( ssl, function(req, res) {
  let host, ws;
  try {
    host = req.headers.host.split(':')[0];
    ws = req.url.indexOf('zmq') !== -1;
  } catch (e) {
    console.log('Error parsing:', req.headers);
  }
  console.log('URL: ', req.url, ws);
  if (host === 'explorer.blockchainfoundry.co') {
    console.log(`Routing to explorer port ${config.explorer.http}`);
    proxy.web(req, res, {
      target: {
        host: 'localhost',
        port: ws ? config.explorer.ws : config.explorer.http
      }
    });
  } else if (host === 'explorer-testnet.blockchainfoundry.co') {
    console.log(`Routing to testnet explorer port ${config['explorer-testnet'].http}`);
    proxy.web(req, res, {
      target: {
        host: 'localhost',
        port: config['explorer-testnet'].http
      }
    });
  }
});

//server.on('upgrade',function(req, socket, head){
//  console.log('up');
//  proxy.ws(req, socket, head, { target: { host: 'localhost', port: 9999 }});
//});

console.log(`listening on port ${config.port}`);
server.listen(config.port);
