/*
 * GET home page.
 */
var mongoose = require('mongoose');
var Account  = mongoose.model('account');
var Stalker  = mongoose.model('stalker');
var socketio = require('socket.io');

var userToSocket = {};
var socketToUser = {};
 
// SOCKET.IO
exports.listen = function(server) {
	var io = socketio.listen(server);
    io.set('log level', 1);
	
	io.sockets.on('connection', function (socket) {
		socket.on('connectMe', function (data) {
			userToSocket[data] = socket.id;
			socketToUser[socket.id] = data;
		});
		socket.on('disconnect', function () {
			delete userToSocket[socketToUser[socket.id]];
			delete socketToUser[socket.id];
		});
		
		socket.on('msg', function (data){
			if (socketToUser[socket.id]) {
				io.sockets.emit('msg', socketToUser[socket.id] + ': ' + data);
			} else {
				io.sockets.emit('msg', 'Gość: ' + data);
			};
		});
	});
};
 
// SIMPLE AUTH AUTHORIZATION
exports.socketConnect = function(req, res) {
	var user_acc;
	if (req.session.account) {
		user_acc = req.session.account['user'];
	};
	res.writeHead(200, {
		'Content-Type': 'application/json; charset=utf8'});
    res.end(JSON.stringify(user_acc));
};



exports.index = function(req, res){
	pageHtml = '';
	if (req.session.account) {
		pageHtml = '<div id="index"><h3>Zalogowany jako ' + req.session.account['user'] + '</h3>' + 
		'<form action="/logout" method="post" accept-charset="utf-8">' + 
			'<button type="submit">Wyloguj</button>' +
		'</form></div>';
	} else {
		pageHtml = '<div id="index"><p class="bold-center">Witam w grze</p>' +
				   '<form action="/login" method="post" accept-charset="utf-8">' + 
						'<table>' +
							'<tr><td><span>Login: </span></td><td><input type="text" name="login"/></td></tr>' +
							'<tr><td><span>Hasło: </span></td><td><input type="password" name="password"/></td></tr>' +
						'</table>' +
						'<button type="submit">Zaloguj</button>' +
					'</form></div>';
	};
	res.render('index', {
		title : 'Stalker Wars',
		purehtml : pageHtml
	});
};

exports.register = function (req, res) {
	var pageHtml = '<div id="register"><form action="/create-acc" method="post" accept-charset="utf-8">' + 
						'<table>' +
							'<tr><td><span>Login: </span></td><td><input type="text" name="login"/></td></tr>' +
							'<tr><td><span>Hasło: </span></td><td><input type="password" name="password"/></td></tr>' +
						'</table>' +
						'<button type="submit">Rejestruj</button>' +
					'</form></div>';
	
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
		res.redirect('/');
	});	
};

exports.login = function (req, res) {
	Account.findOne({ 'login' : req.body.login}, function (err, account) {
		var pageHtml = '', purehtml = 
		'<div id="login"><form action="/login" method="post" accept-charset="utf-8">' + 
			'<table>' +
				'<tr><td><span>Login: </span></td><td><input type="text" name="login"/></td></tr>' +
				'<tr><td><span>Hasło: </span></td><td><input type="password" name="password"/></td></tr>' +
			'</table>' +
			'<button id="login_btn" type="submit">Zaloguj</button>' +
		'</form></div>';
		if (account) {
			if (account.isValidPassword(req.body.password)) {
				pageHtml = '<h1>Witaj w grze ' + account.login + '</h1>';
				purehtml = '';
				// Session
				req.session.account = ({
					user: account.login
				});
			} else {
				pageHtml = '<div id="login"><h3>Błędne hasło, spróbuj jeszcze raz</h3></div>';
			}
		} else {
			pageHtml = '<div id="login"><h3>Podany użytkownik nie istnieje, spróbuj jeszcze raz</h3></div>';
		};
		res.redirect('/');
	}).update(
		{ $set: { last_login: Date.now() } }
	);
};

exports.logout = function (req, res) {
	delete socketToUser[userToSocket[req.session.account['user']]];
	delete userToSocket[req.session.account['user']];
	req.session.account = null;
	res.redirect('/');
};

exports.createChar = function (req, res) {
	var img = '';
	for(var i = 0; i < 6; i += 1){
		img += "<img src=\"../images\\avatar_" + i + ".jpg\" class=\"avatars\"/>";
	};
	var pageHtml = '';
	if (req.session.account) {
		pageHtml = '<div id="create-character"><form action="/create-character" method="post" accept-charset="utf-8">' + 
			'<table>' +
				'<tr><td><span>Avatar: </span></td><td><img class="avatars" id="avatar" src="../images/avatar_none.jpg"/></td></tr>' +
				'<tr><td><span>Imie: </span></td><td><input type="text" name="nickname"/></td></tr>' +
				'<tr><td><span>Klasa: </span></td><td>' +
				'<select name="prof" form="reg-usr">' +
				'<option value="Wojownik">Wojownik</option><option value="Łotrzyk">Łotrzyk</option>' +
				'<option value="Paladyn">Paladyn</option><option value="Mag">Mag</option>' +
				'</select></td></tr>' +
				'<tr><td><span>Siła: </span></td><td><span>0</span>' +
				'<img src="../images/plus.png" class="stats-btn"/><img src="../images/minus.png" class="stats-btn"/>' +
				'<tr><td><span>Zręczność: </span></td><td><span>0</span>' +
				'<img src="../images/plus.png" class="stats-btn"/><img src="../images/minus.png" class="stats-btn"/>' +
				'<tr><td><span>Wytrzymałość: </span></td><td><span>0</span>' +
				'<img src="../images/plus.png" class="stats-btn"/><img src="../images/minus.png" class="stats-btn"/>' +
			'</table>' +
			'<button type="submit">Stwórz postać</button>' +
		'</form><div style=\"display : none;" id="avatars_choose">' + img + 
		'<img id="close_popup" src="../images/close.png"></div></div>';
	} else {
		pageHtml = '<div id="create-character"><h3>Zaloguj się zanim zrobisz postać</h3></div>';
	};
	res.writeHead(200, {
		'Content-Type': 'application/json; charset=utf8'});
	res.end(JSON.stringify(pageHtml));
};

exports.createStalker = function (req, res) {
	new Stalker({
		nickname	: req.body.nickname,
		race		: req.body.race,
		prof		: req.body.prof,
		strength	: req.body.strength,
		agility		: req.body.agility,
		endurance	: req.body.endurance,
		magic		: req.body.magic,
		lucky		: req.body.lucky,
		dmg			: req.body.dmg,
		crit		: req.body.crit,
		hp			: req.body.hp,
		mana		: req.body.mana,
		reg_date	: Date.now()
	}).save(function (err, stalker, count) {
		res.redirect('/');
	});	
};

exports.players = function (req, res) {
	if (req.session.account) {
		Stalker.find( function (err, stalkers, count) {
			var players = '', i = 0;
			stalkers.forEach(function (stalker) {
				i += 1;
				players += 	'<p>Imie: ' + stalker.login + '</p>';
			});
			if (i === 0) {
				players += 'Aktualnie brak graczy';
			};
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf8'});
			res.end(JSON.stringify('<div id="players">' + players + '</div>'));
		});
	} else {
		pageHtml = '<div id="players"><h3>Nie jesteś zalogowany</h3></div>';
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify(pageHtml));
	};
	
	
	
	
	
};