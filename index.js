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

//
// Create a proxy server with custom application logic
//
const proxy = httpProxy.createProxyServer({
  target: 'https://localhost:9999/zmq',
  ws: true
});

proxy.on('upgrade', function (req, socket, head) {
  console.log('upgrade');
  proxy.ws(req, socket, head);
});

proxy.on( 'proxyReqWs', function ( proxyReqWs, req, res ) {
  console.log( 'Proxy *WS* Request', proxyReqWs.path );
});

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
const server = https.createServer( ssl, function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.gi
  let host = req.headers.host.split(':')[0];
  let port = req.headers.host.split(':')[1];

  if (port) port = +port; //convert to number
  if (host === 'explorer.blockchainfoundry.co') {
    console.log(`Routing to explorer port ${config.explorer.http}`);
    proxy.web(req, res, { target: { host: 'localhost', port: config.explorer.http }});
  } else if (host === 'explorer-testnet.blockchainfoundry.co') {
    console.log(`Routing to testnet explorer port ${config['explorer-testnet'].http}`);
    proxy.web(req, res, { target: { host: 'localhost', port: config['explorer-testnet'].http }});
  }
});

console.log(`listening on port ${config.port}`);
server.listen(config.port);
