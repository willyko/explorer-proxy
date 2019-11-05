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
const proxy = httpProxy.createProxyServer({});

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
  console.log(hostName, port);

  if (port) port = +port; //convert to number
  if (host === 'explorer.blockchainfoundry.co') {
    if (port !== config.explorer.wsPort) {
      console.log(`Routing to explorer port ${config.explorer.http}`);
      proxy.web(req, res, { target: { host: 'localhost', port: config.explorer.http }});
    } else {
      console.log(`Routing to explorer WS port ${config.explorer.http}`);
      proxy.web(req, res, { target: { host: 'localhost', port: config.explorer.wsPort }, ws: true });
    }
  } else if (host === 'explorer-testnet.blockchainfoundry.co') {
    //if (port !== config.wsPort) {
      console.log(`Routing to testnet explorer port ${config['explorer-testnet'].http}`);
      proxy.web(req, res, { target: { host: 'localhost', port: config['explorer-testnet'].http }, ws: true});
    //} else {
    //}
  }
});

//proxy.on('proxyRes', function (proxyRes, req, res) {
//  console.log('RAW Response from the target', JSON.stringify(proxyRes.headers, true, 2));
//
//  // Set CORS headers
//  res.setHeader('Access-Control-Allow-Origin', '*');
//  res.setHeader('Access-Control-Request-Method', '*');
//  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
//  res.setHeader('Access-Control-Allow-Headers', '*');
//  if ( proxyRes.method === 'OPTIONS' ) {
//    res.writeHead(200);
//    res.end();
//    return;
//  }
//  res.writeHead(200);
//  res.end();
//});

//server.on('upgrade', function (req, socket, head) {
//  proxy.ws(req, socket, head);
//});

console.log(`listening on port ${config.port}`);
server.listen(config.port);
