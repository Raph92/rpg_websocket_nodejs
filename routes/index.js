/*
 * GET home page.
 */
var mongoose = require('mongoose');
var Account  = mongoose.model('account');
var Stalker  = mongoose.model('stalker');
var StalkerSchema = mongoose.model('stalkerSchema');
var socketio = require('socket.io');

var stalkerToSocket = {};
var socketToStalker = {};
 
var stalkersInBattle = {}; 

var fightCount = 0;

// SOCKET.IO
exports.listen = function(server) {
	var io = socketio.listen(server);
    io.set('log level', 1);
	
	io.sockets.on('connection', function (socket) {
		socket.on('connectMe', function (data) {
			stalkerToSocket[data] = socket.id;
			socketToStalker[socket.id] = data;
		});
		socket.on('disconnect', function () {
			delete stalkerToSocket[socketToStalker[socket.id]];
			delete socketToStalker[socket.id];
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
			io.sockets.socket(stalkerToSocket[data]).emit('wantYouFight', { who: socketToStalker[socket.id] } );
			// socket.join(room);
		});
		
	});
};
 

 
// SOCKET CONNECTED LIST
exports.socketConnect = function(req, res) {
	if (req.session.account) {
		Stalker.findOne({ 'account' : req.session.account['user']}, function (err, stalkers) {
			var user_char;
			if (stalkers !== null) {
				user_char = stalkers.nick;
				req.session.account['stalker'] = user_char;
				res.writeHead(200, {
					'Content-Type': 'application/json; charset=utf8'});
				res.end(JSON.stringify(user_char));
			} else {
				res.writeHead(200, {
					'Content-Type': 'application/json; charset=utf8'});
				res.end();
			}
		});
	} else {
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end();
	}
};



exports.index = function(req, res){
	pageHtml = '';
	if (req.session.account) {
		pageHtml = '<div id="index"><h3>Zalogowany jako ' + req.session.account['user'] + '</h3>' + 
		'<form action="/logout" method="post" accept-charset="utf-8">' + 
			'<button class="button_input" type="submit">Wyloguj</button>' +
		'</form></div>';
	} else {
		pageHtml = '<div id="index"><p class="bold-center">Witam w grze</p>' +
				   '<form action="/login" method="post" accept-charset="utf-8">' + 
						'<table>' +
							'<tr><td><span>Login: </span></td><td><input class="text_input" type="text" name="login"/></td></tr>' +
							'<tr><td><span>Hasło: </span></td><td><input class="text_input" type="password" name="password"/></td></tr>' +
						'</table>' +
						'<button class="button_input" type="submit">Zaloguj</button>' +
					'</form></div>';
	};
	res.render('index', {
		title : 'Stalker Wars',
		purehtml : pageHtml
	});
};

exports.register = function (req, res) {
	var pageHtml = '';
	if (!req.session.account['user']) {
		pageHtml = '<div id="register"><form action="/create-acc" method="post" accept-charset="utf-8">' + 
							'<table>' +
								'<tr><td><span>Login: </span></td><td><input class="text_input" type="text" name="login"/></td></tr>' +
								'<tr><td><span>Hasło: </span></td><td><input class="text_input" type="password" name="password"/></td></tr>' +
							'</table>' +
							'<button class="button_input" type="submit">Rejestruj</button>' +
						'</form></div>';
	} else {
		pageHtml = '<div id="register">Wyloguj się zanim stworzysz nowe konto</div>';
	};
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify(pageHtml));
};

exports.createAcc = function (req, res) {
	new Account({
		login		: req.body.login,
		reg_date	: Date.now(),
		last_login	: Date.now()
	}).setPassword(req.body.password)
	  .save(function (err, count) {
		if (err) {
		  if (err.code === 11000) {
		    res.render('index', {
			  title : 'Stalker Wars',
			  purehtml : 'Istnieje już konto o takim loginie'
			});
		  };
		} else {
			res.redirect('/');
		};
	});	
	// Złapać error unique login
};

exports.login = function (req, res) {
	Account.findOne({ 'login' : req.body.login}, function (err, account) {
		var pageHtml = '', purehtml = 
		'<div id="login"><form action="/login" method="post" accept-charset="utf-8">' + 
			'<table>' +
				'<tr><td><span>Login: </span></td><td><input class="text_input" type="text" name="login"/></td></tr>' +
				'<tr><td><span>Hasło: </span></td><td><input class="text_input" type="password" name="password"/></td></tr>' +
			'</table>' +
			'<button class="button_input" id="login_btn" type="submit">Zaloguj</button>' +
		'</form></div>';
		if (account) {
			if (account.isValidPassword(req.body.password)) {
				pageHtml = '<h1>Witaj w grze ' + account.login + '</h1>';
				purehtml = '';
				// Session
				req.session.account = ({
					user: account.login
				});
				res.redirect('/');
			} else {
				pageHtml = '<div id="login"><h3>Błędne hasło, spróbuj jeszcze raz</h3></div>';
				res.render('index', {
					title : 'Stalker Wars',
					purehtml : pageHtml
				});
			}
		} else {
			pageHtml = '<div id="login"><h3>Podany użytkownik nie istnieje, spróbuj jeszcze raz</h3></div>';
			res.render('index', {
				title : 'Stalker Wars',
				purehtml : pageHtml
			});
		};
	}).update(
		{ $set: { last_login: Date.now() } }
	);
};

exports.logout = function (req, res) {
	delete socketToStalker[stalkerToSocket[req.session.account['user']]];
	delete stalkerToSocket[req.session.account['user']];
	req.session.account = null;
	res.redirect('/');
};

exports.createChar = function (req, res) {
	var lookForStalker = function(callback) {
		Stalker.findOne({ 'account' : req.session.account['user']}, function (err, stalkers) {
			var check = stalkers;
			callback(check);
		});
	};
	
	var img = '';
	for(var i = 0; i < 6; i += 1){
		img += "<img src=\"../images\\avatar_" + i + ".jpg\" class=\"avatars\"/>";
	};
	var pageHtml = '';
	if (req.session.account) {
		lookForStalker(function (check) {
			if (check === null) {
				pageHtml = '<div id="create-character"><form id="crt-char-form" action="/create-stalker" method="post" accept-charset="utf-8">' + 
					'<table>' +
						'<tr><td><span>Avatar: </span></td><td><img id="avatar" src="../images/avatar_none.jpg"/>' + 
						'<input type="hidden" name="avatar"/></td>' + 
						'<td><img id="faction" src="../images/avatar_none.jpg"/></td></tr>' +
						'<tr><td><span>Imie: </span></td><td><input type="text" name="nickname" class="text_input"/></td></tr>' +
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
					res.writeHead(200, {
						'Content-Type': 'application/json; charset=utf8'});
					res.end(JSON.stringify(pageHtml));
			} else {
				pageHtml = '<div id="create-character">Masz już postać, jeśli chcesz zrobić nową skorzystaj najpierw z zakładki usuń postać</div>';
				res.writeHead(200, {
					'Content-Type': 'application/json; charset=utf8'});
				res.end(JSON.stringify(pageHtml));
			};
		});
	} else {
		pageHtml = '<div id="create-character"><h3>Zaloguj się zanim zrobisz postać</h3></div>';
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify(pageHtml));
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
		level		: '1',
		faction		: req.body.faction,
		str			: req.body.strength,
		acc			: req.body.accuracy,
		end			: req.body.endurance,
		account		: req.session.account['user']
	}).calcStats()
	  .save(function (err, count) {
		if (err) {
			if (err.code === 11000) {
				res.render('index', {
					title : 'Stalker Wars',
					purehtml : 'Istnieje już postać o takim nicku'
				});
			};
		} else {
			res.redirect('/');
		};
	});	
};

exports.statistics = function (req, res) {
	if (req.session.account) {
		Stalker.findOne({'account' : req.session.account['user']}, function (err, stalkers){
			var pageHtml = '<div id="statistics">';
			if(stalkers) {
				pageHtml += '<table><tr><td><img class="avatars" src="' + stalkers.avatar + '"/></td>';
				pageHtml += '<td><img class="avatars" src="../images/faction_' + stalkers.faction + '.png"/></td></tr>';
				pageHtml += '<tr><td>Imię</td><td>' + stalkers.nick + '</td></tr>';
				pageHtml += '<tr><td>Poziom</td><td>' + stalkers.level + '</td></tr>';
				pageHtml += '<tr><td>Siła: </td><td><img class="stat-icons" src="../images/str_icon.png"/>' + stalkers.str + '</td></tr>';
				pageHtml += '<tr><td>Celność: </td><td><img class="stat-icons" src="../images/acc_icon.png"/>' + stalkers.acc + '</td></tr>';
				pageHtml += '<tr><td>Wytrzymałość: </td><td><img class="stat-icons" src="../images/end_icon.png"/>' + stalkers.end + '</td></tr>';
				pageHtml += '<tr><td>Obrażenia: </td><td>' + stalkers.dmg + '</td></tr>';
				pageHtml += '<tr><td>Headshoot: </td><td>' + stalkers.headshoot + '%</td></tr>';
				pageHtml += '<tr><td>Życie: </td><td>' + stalkers.life + '/' + parseInt(stalkers.end) * 20 + ' HP</td></tr>';
			} else {
				pageHtml += 'Najpierw musisz stworzyć postać</div>';
			};
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf8'});
			res.end(JSON.stringify(pageHtml));
		});
	} else {
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify('<div id="statistics">Najpierw musisz się zalogować</div>'));
	};
};

exports.players = function (req, res) {
	// if (req.session.account) {
		// Stalker.find( function (err, stalkers, count) {
			// var players = '', i = 0;
			// stalkers.forEach(function (stalker) {
				// i += 1;
				// players += 	'<p>Imie: ' + stalker.nick + '</p>';
			// });
			// if (i === 0) {
				// players += 'Aktualnie brak graczy';
			// };
			// res.writeHead(200, {
				// 'Content-Type': 'application/json; charset=utf8'});
			// res.end(JSON.stringify('<div id="players">' + players + '</div>'));
		// });
	// } else {
		// pageHtml = '<div id="players"><h3>Nie jesteś zalogowany</h3></div>';
		// res.writeHead(200, {
			// 'Content-Type': 'application/json; charset=utf8'});
		// res.end(JSON.stringify(pageHtml));
	// };
	
	var pageHtml = '<div id="players">';	
	if (req.session.account) {
		for (x in stalkerToSocket) {
			pageHtml += '<p>' + x + '</p>';
		};
		pageHtml += '</div>';
	} else {
		pageHtml += 'Lista graczy dostępna tylko dla zalogowanych</div>';
	}
	res.writeHead(200, {
		'Content-Type': 'application/json; charset=utf8'});
	res.end(JSON.stringify(pageHtml));
};

exports.removeCharacter = function (req, res) {
	Stalker.findOne({'account' : req.session.account['user']}, function (err,stalkers) {
		if (stalkers) {
			stalkers.remove();
			delete socketToStalker[stalkerToSocket[req.session.account['user']]];
			delete stalkerToSocket[req.session.account['user']];
			// Potwierdzenie
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf8'});
			res.end(JSON.stringify('<div id="remove-character">Skasowano</div>'));
		} else {
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf8'});
			res.end(JSON.stringify('<div id="remove-character">Aktualnie nie masz postaci</div>'));
		};
	});
};

exports.battles = function (req, res) {
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