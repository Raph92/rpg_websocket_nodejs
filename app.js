
/**
 * Module dependencies.
 */

var express = require('express')
  ,	db = require( './db' )
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();

var genSalt = function (count) {
	var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
	var mySalt = '';
	
	for (var i = 0; i < count; i += 1) {
		mySalt += chars[Math.floor(Math.random()*100) % 63];
	};
	return mySalt;
};

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser('O-bDGMPbOggkKiVsIpKcwitNKyAFzsiL7CEKperKAFIlDqvyo4'));
app.use(express.session());
app.use(app.router);
 app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Webpage views
app.get('/', routes.index);
app.get('/register', routes.register);
app.get('/create-character', routes.createChar);
app.get('/players', routes.players);
app.get('/get-character-schema', routes.getCharacterSchema);
app.post('/socket-connect', routes.socketConnect);
app.post('/login', routes.login);
app.post('/logout', routes.logout);


// Database schemas
app.post('/create-acc', routes.createAcc);
app.post('/create-stalker', routes.createStalker);
app.get('/users', user.list);

var server = http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

var socketServer = require('./routes/index');
socketServer.listen(server);

