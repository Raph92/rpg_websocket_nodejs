/*
 * GET home page.
 */
var mongoose = require('mongoose');
var Stalker  = mongoose.model('stalker');
var StalkerSchema = mongoose.model('stalkerSchema');
var socketio = require('socket.io');

var stalkerToSocket = {};
var socketToStalker = {};
 
var stalkersInBattle = {}; 
var fightCount = 0;




/*-----------------------
      SOCKET LOGIC
-----------------------*/
exports.listen = function(server) {
	var io = socketio.listen(server);
    io.set('log level', 1);
	
	io.sockets.on('connection', function (socket) {
		socket.on('connectMe', function (data) {
			stalkerToSocket[data] = socket.id;
			socketToStalker[socket.id] = data;
			io.sockets.emit('players-list', playersList());
		});
		socket.on('disconnect', function () {
			delete stalkerToSocket[socketToStalker[socket.id]];
			delete socketToStalker[socket.id];
			io.sockets.emit('players-list', playersList());
		});
		
		socket.on('msg', function (data){
			if (socketToStalker[socket.id]) {
				io.sockets.emit('msg', socketToStalker[socket.id] + ': ' + data);
			} else {
				io.sockets.emit('msg', 'Gość: ' + data);
			};
		});
		
		socket.on('fightWithMe', function (data){
			// var room = socketToStalker[socket.id] + '/' + data;
			// stalkersInBattle[socket.id] = room;
			if ( stalkerToSocket[data] !== socket.id) {
				io.sockets.socket(stalkerToSocket[data]).emit('wantYouFight', { who: socketToStalker[socket.id] } );
			};
			// socket.join(room);
		});
		
	});
};
 

/*------------------------------------------------ 
      LIST OF PLAYERS AVAILABLE VIA SOCKETS
------------------------------------------------*/
exports.socketConnect = function(req, res) {
	if (req.session.account) {
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify(req.session.account['stalker']));
		
	} else {
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify(null));
	}
};

var playersList = function (mySocket) {
	var stalkersList = [];	
	for (x in stalkerToSocket) {
		stalkersList.push(x);
	};
	return stalkersList;
};




exports.index = function(req, res){
	var pageHtml = '',
		statistics = '';
	if (!req.session.account) {
		pageHtml = '<div id="index"><p class="bold-center">Witam w grze</p>' +
				   '<form action="/login" method="post" accept-charset="utf-8">' + 
						'<table>' +
							'<tr><td><span>Login: </span></td><td><input class="text_input" type="text" name="login"/></td></tr>' +
							'<tr><td><span>Hasło: </span></td><td>' + 
							'<input class="text_input" type="password" name="password"/></td></tr>' +
						'</table>' +
						'<button class="button_input" type="submit">Zaloguj</button>' +
					'</form>' + 
					'<p>Jeśli nie masz jeszcze postaci, zarejestruj się</p>' + 
					'<form id="register-form" action="/create-character" method="get"><button class="button_input"' +
					'type="submit">Rejestracja</button></form></div>';
	};
	res.render('index', {
		gaming : pageHtml
	});
};

exports.login = function (req, res) {
	Stalker.findOne({ 'nick' : req.body.login}, function (err, stalker) {
		var pageHtml = '', purehtml = 
		'<div id="index"><form action="/login" method="post" accept-charset="utf-8">' + 
			'<table>' +
				'<tr><td><span>Login: </span></td><td><input class="text_input" type="text" name="login"/></td></tr>' +
				'<tr><td><span>Hasło: </span></td><td><input class="text_input" type="password" name="password"/></td></tr>' +
			'</table>' +
			'<button class="button_input" id="login_btn" type="submit">Zaloguj</button>' +
		'</form></div>';
		if (stalker) {
			if (stalker.isValidPassword(req.body.password)) {
				pageHtml = '<h1>Witaj w grze ' + stalker.nick + '</h1>';
				// Session
				req.session.account = ({
					stalker: stalker.nick
				});
				res.redirect('/');
			} else {
				pageHtml = '<div id="index"><h3>Błędne hasło, spróbuj jeszcze raz</h3></div>';
				res.render('index', {
					gaming : pageHtml,
					statistics : '',
					players	: '',
					inventory : ''
				});
			}
		} else {
			pageHtml = '<div id="index"><h3>Podany gracz nie istnieje, spróbuj jeszcze raz</h3></div>';
			res.render('index', {
				gaming : pageHtml
			});
		};
	}).update(
		{ $set: { last_login: Date.now() } }
	);
};

exports.logout = function (req, res) {
	delete socketToStalker[stalkerToSocket[req.session.account['stalker']]];
	delete stalkerToSocket[req.session.account['stalker']];
	req.session.account = null;
	res.redirect('/');
};

exports.createChar = function (req, res) {
	var img = '';
	for(var i = 0; i < 6; i += 1){
		img += "<img src=\"../images\\avatar_" + i + ".jpg\" class=\"avatars\"/>";
	};
	var pageHtml = '';
	if (!req.session.account) {
		pageHtml = '<div id="create-character"><form id="crt-char-form" action="/create-stalker" method="post" accept-charset="utf-8">' + 
			'<table>' +
				'<tr><td></td><td></td><td rowspan=7><input type="hidden" name="avatar"/>' + 
				'<img id="avatar" src="../images/avatar_none.jpg"/><br/><img id="faction" src="../images/avatar_none.jpg"/></td></tr>' +
				'<tr><td><span>Imie: </span></td><td><input type="text" name="nickname" class="text_input"/></td></tr>' +
				'<tr><td><span>Hasło: </span></td><td><input type="password" name="password" class="text_input"/></td></tr>' +
				'<tr><td><span>Frakcja: </span></td><td>' +
				'<select class="select_input" name="faction" form="crt-char-form">' +
				'<option value="loners">Stalkerzy</option><option value="freedom">Wolność</option>' +
				'<option value="duty">Powinność</option>' +
				'</select></td></tr>' +
				'<tr><td><span>Siła: </span><img class="stat-icons" src="../images/str_icon.png"></td>' + 
				'<td><span></span><input type="hidden" name="strength"/>' +
				'<img name="plus" src="../images/plus.png" class="stats-btn"/>' + 
				'<img name="minus" src="../images/minus.png" class="stats-btn"/></td></tr>' +
				'<tr><td><span>Celność: </span><img class="stat-icons" src="../images/acc_icon.png"></td>' + 
				'<td><span></span><input type="hidden" name="accuracy"/>' +
				'<img name="plus" src="../images/plus.png" class="stats-btn"/>' +
				'<img name="minus" src="../images/minus.png" class="stats-btn"/></td></tr>' +
				'<tr><td><span>Wytrzymałość: </span><img class="stat-icons" src="../images/end_icon.png"></td><td><span></span><input type="hidden" name="endurance"/>' +
				'<img name="plus" src="../images/plus.png" class="stats-btn"/>' +
				'<img name="minus" src="../images/minus.png" class="stats-btn"/></td></tr>' +
				'<tr><td><span>Punkty: </span><img class="stat-icons" src="../images/points_icon.png"></td>' +
				'<td><span></span><input type="hidden" name="points"/></td></tr>' +
			'</table>' +
			'<button class="button_input" type="submit">Stwórz postać</button></form>' +
			'<div style=\"display : none;" id="avatars_choose">' + img + 
			'<img id="close_popup" src="../images/close.png"></div></div>';
			res.render('index', {
				gaming : pageHtml
			});
	} else {
		pageHtml = '<div id="create-character"><h3>Wyloguj się nim stworzysz kolejną postać</h3></div>';
		res.render('index', {
			gaming : pageHtml
		});
	};
};

exports.getCharacterSchema = function (req, res) {
	StalkerSchema.findOne({ 'name' : req.query.faction}, function (err, stalkerschemas) {
		var schema = { 'image' : stalkerschemas.image, 'str' : stalkerschemas.str, 'acc' : stalkerschemas.acc, 
					  'end' : stalkerschemas.end, 'points' : stalkerschemas.points };
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify(schema));
	});
};

exports.createStalker = function (req, res) {
	new Stalker({
		nick		: req.body.nickname,
		avatar		: req.body.avatar,
		last_login	: Date.now(),
		level		: parseInt(1, 10),
		points		: parseInt(0, 10),
		faction		: req.body.faction,
		str			: parseInt(req.body.strength, 10),
		acc			: parseInt(req.body.accuracy, 10),
		end			: parseInt(req.body.endurance, 10),
		life		: parseInt(req.body.endurance, 10) * 20,
	}).setPassword(req.body.password)
	  .save(function (err, count) {
		if (err) {
			if (err.code === 11000) {
				res.render('index', {
					gaming : 'Istnieje już postać o takim nicku'
				});
			};
		} else {
			res.redirect('/');
		};
	});	
	
};

exports.statistics = function (req, res) {
	if (req.session.account) {
		Stalker.findOne({'nick' : req.session.account['stalker']}, function (err, stalkers){
			var pageHtml = '';
			if(stalkers) {
				pageHtml += '<table><tr><td></td><td></td><td rowspan=8><img class="avatars" src="' + stalkers.avatar + '"/>';
				pageHtml += '<br/><img class="avatars" src="../images/faction_' + stalkers.faction + '.png"/></td></tr>';
				pageHtml += '<tr><td>Imię</td><td>' + stalkers.nick + '</td></tr>';
				pageHtml += '<tr><td>Poziom</td><td>' + stalkers.level + '</td></tr>';
				pageHtml += '<tr><td colspan=2><img class="stat-icons" src="../images/str_icon.png"/>' + stalkers.str;
				pageHtml += '<img class="stat-icons" src="../images/acc_icon.png"/>' + stalkers.acc;
				pageHtml += '<img class="stat-icons" src="../images/end_icon.png"/>' + stalkers.end;
				pageHtml += '</td></tr><tr><td>Dmg: </td><td>' + parseInt(stalkers.str, 10) * 1,5 + '</td></tr>';
				pageHtml += '<tr><td>Headshoot: </td><td>' + parseInt(stalkers.acc, 10) + '%</td></tr>';
				pageHtml += '<tr><td>Życie: </td><td>' + stalkers.life + '/' + parseInt(stalkers.end) * 20 + ' HP</td></tr></table>';
			};
			pageHtml += '<br/><form action="/logout" method="post" accept-charset="utf-8">' + 
							'<button class="button_input" type="submit">Wyloguj</button>' +
						'</form>';
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf8'});
			res.end(JSON.stringify(pageHtml));
		});
	} else {
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify('Najpierw musisz się zalogować'));
	};
};



exports.removeCharacter = function (req, res) {
	if (req.session.account) {
		Stalker.findOne({'nick' : req.session.account['stalker']}, function (err,stalkers) {
			if (stalkers) {
				stalkers.remove();
				delete socketToStalker[stalkerToSocket[req.session.account['stalker']]];
				delete stalkerToSocket[req.session.account['stalker']];
				req.session.account = null;
				res.writeHead(200, {
					'Content-Type': 'application/json; charset=utf8'});
				res.end(JSON.stringify('<div id="remove-character">Skasowano</div>'));
			}
		});
	} else {
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify('<div id="remove-character">Zaloguj się jak chcesz usunąć swoje konto</div>'));
	};
};

exports.players = function (req, res) {
	var pageHtml = '<div id="battles">';	
	if (req.session.account) {
		for (x in stalkerToSocket) {
			// if (x !== req.session.account['stalker']) {
				pageHtml += '<p><img name="att" src="../images/attack_icon.png" class="op-icons" /><span>' + x + '</span></p>';
			// }	
		};
		pageHtml += '</div>';
	} else {
		pageHtml += 'Lista graczy dostępna tylko dla zalogowanych</div>';
	}
	res.writeHead(200, {
		'Content-Type': 'application/json; charset=utf8'});
	res.end(JSON.stringify(pageHtml));

};