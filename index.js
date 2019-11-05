const http = require('http'),
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
const proxy = httpProxy.createProxyServer({ ssl, secure: true });

//
// Create your custom server and just call `proxy.web()` to proxy
// a web request to the target passed in the options
// also you can use `proxy.ws()` to proxy a websockets request
//
const server = http.createServer( function(req, res) {
  // You can define here your custom logic to handle the request
  // and then proxy the request.gi
  let hostName = req.headers.host.split(':')[0];
  let port = req.headers.host.split(':')[1];
  console.log(req.headers);
  if (hostName === 'explorer.blockchainfoundry.co') {
    if (port !== config.wsPort) {
      console.log(`Routing to explorer port ${config.explorer.http}`);
      proxy.web(req, res, { target: 'localhost', port: config.explorer.http, ssl, secure: true });
    } else {

    }
  } else if (req.headers.host === 'explorer-testnet.blockchainfoundry.co') {
    if (port !== config.wsPort) {
      console.log(`Routing to testnet explorer port ${config['explorer-testnet'].http}`);
      proxy.web(req, res, { port: config['explorer-testnet'].http, ssl });
    } else {

    }
  }

  return { ssl, secure: true };
});

//server.on('upgrade', function (req, socket, head) {
//  proxy.ws(req, socket, head);
//});

console.log(`listening on port ${config.port}`);
server.listen(config.port);
