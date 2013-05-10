/*
 * GET home page.
 */
var mongoose = require('mongoose');
var Account  = mongoose.model('Account');
var Hero 	 = mongoose.model('Hero');
var socketio = require('socket.io');

var userToSocket = {};
var socketToUser = {};
 
// SOCKET.IO LOGIC
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
				console.log(userToSocket);
				console.log(socketToUser);
			};
		});
	});
};
 
// SET SOCKET DATA
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
		pageHtml = '<h3>Zalogowany jako ' + req.session.account['user'] + '</h3>' + 
		'<form id="reg-usr" action="/logout" method="post" accept-charset="utf-8">' + 
			'<button type="submit">Wyloguj</button>' +
		'</form>';
	} else {
		pageHtml = '<p class="bold-center">Witam w grze</p>' +
				   '<form id="reg-usr" action="/login" method="post" accept-charset="utf-8">' + 
						'<table>' +
							'<tr><td><span>Login: </span></td><td><input type="text" name="login"/></td></tr>' +
							'<tr><td><span>Hasło: </span></td><td><input type="password" name="password"/></td></tr>' +
						'</table>' +
						'<button type="submit">Zaloguj</button>' +
					'</form>';
	};
	res.render('index', {
		title : 'Web of Heroes',
		purehtml : pageHtml
	});
};




exports.register = function (req, res) {
	var pageHtml = '<form id="reg-usr" action="/createAcc" method="post" accept-charset="utf-8">' + 
						'<table>' +
							'<tr><td><span>Login: </span></td><td><input type="text" name="login"/></td></tr>' +
							'<tr><td><span>Hasło: </span></td><td><input type="password" name="password"/></td></tr>' +
						'</table>' +
						'<button type="submit">Rejestruj</button>' +
					'</form>';
	
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
		'<form id="reg-usr" action="/login" method="post" accept-charset="utf-8">' + 
			'<table>' +
				'<tr><td><span>Login: </span></td><td><input type="text" name="login"/></td></tr>' +
				'<tr><td><span>Hasło: </span></td><td><input type="password" name="password"/></td></tr>' +
			'</table>' +
			'<button id="login_btn" type="submit">Zaloguj</button>' +
		'</form>';
		if (account) {
			if (account.isValidPassword(req.body.password)) {
				pageHtml = '<h1>Witaj w grze ' + account.login + '</h1>';
				purehtml = '';
				// Session
				req.session.account = ({
					user: account.login
				});
			} else {
				pageHtml = '<h3>Błędne hasło, spróbuj jeszcze raz</h3>';
			}
		} else {
			pageHtml = '<h3>Podany użytkownik nie istnieje, spróbuj jeszcze raz</h3>';
		};
		res.redirect('/');
	}).update(
		{ $set: { last_login: Date.now() } }
	);
};

exports.logout = function (req, res) {
	delete userToSocket[socketToUser[socket.id]];
	delete socketToUser[socket.id];
	req.session.account = null;
	res.redirect('/');
};

exports.createChar = function (req, res) {
	var pageHtml = '';
	if (req.session.account) {
		pageHtml = '<form id="reg-usr" action="/createHero" method="post" accept-charset="utf-8">' + 
			'<table>' +
				'<tr><td><span>Avatar: </span></td><td><img id="avatar" src="../images/avatar.jpg"/></td></tr>' +
				'<tr><td><span>Imie: </span></td><td><input type="text" name="nickname"/></td></tr>' +
				'<tr><td><span>Rasa: </span></td><td>' + 
				'<select name="race" form="reg-usr">' +
				'<option value="Człowiek">Człowiek</option><option value="Elf">Elf</option>' +
				'<option value="Krasnolud">Krasnolud</option><option value="Ork">Ork</option>' +
				'</select></td></tr>' +
				'<tr><td><span>Klasa: </span></td><td>' +
				'<select name="prof" form="reg-usr">' +
				'<option value="Wojownik">Wojownik</option><option value="Łotrzyk">Łotrzyk</option>' +
				'<option value="Paladyn">Paladyn</option><option value="Mag">Mag</option>' +
				'</select></td></tr>' +
				'<tr><td><span>Siła: </span></td><td><span>0</span>' +
				'<img src="../images/plus.png" class="mng-btn"/><img src="../images/minus.png" class="mng-btn"/>' +
				'<input type="hidden" name="strength"/></td></tr>' +
				'<tr><td><span>Zręczność: </span></td><td><span>0</span>' +
				'<img src="../images/plus.png" class="mng-btn"/><img src="../images/minus.png" class="mng-btn"/>' +
				'<input type="hidden" name="agility"/></td></tr>' +
				'<tr><td><span>Wytrzymałość: </span></td><td><span>0</span>' +
				'<img src="../images/plus.png" class="mng-btn"/><img src="../images/minus.png" class="mng-btn"/>' +
				'<input type="hidden" name="endurance"/></td></tr>' +
				'<tr><td><span>Magia: </span></td><td><span>0</span>' +
				'<img src="../images/plus.png" class="mng-btn"/><img src="../images/minus.png" class="mng-btn"/>' +
				'<input type="hidden" name="magic"/></td></tr>' +
				'<tr><td><span>Szczęście: </span></td><td><span>0</span>' +
				'<img src="../images/plus.png" class="mng-btn"/><img src="../images/minus.png" class="mng-btn"/>' +
				'<input type="hidden" name="lucky"/></td></tr>' +
				'<input type="hidden" name="dmg"/>' +
				'<input type="hidden" name="crit"/>' +
				'<input type="hidden" name="hp"/>' +
				'<input type="hidden" name="mana"/>' +						
			'</table>' +
			'<button type="submit">Stwórz postać</button>' +
		'</form>';
	} else {
		pageHtml = '<h3>Zaloguj się zanim zrobisz postać</h3>';
	};
	res.writeHead(200, {
		'Content-Type': 'application/json; charset=utf8'});
	res.end(JSON.stringify(pageHtml));
};

exports.createHero = function (req, res) {
	new Hero({
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
	}).save(function (err, hero, count) {
		res.redirect('/');
	});	
};

exports.players = function (req, res) {
	if (req.session.account) {
		Hero.find( function (err, heros, count) {
			var players = '', i = 0;
			heros.forEach(function (hero) {
				i += 1;
				players += 	'<p>Imie: ' + hero.login + '</p>';
			});
			if (i === 0) {
				players += 'Aktualnie brak graczy';
			};
			res.writeHead(200, {
				'Content-Type': 'application/json; charset=utf8'});
			res.end(JSON.stringify(players));
		});
	} else {
		pageHtml = '<h3>Nie jesteś zalogowany</h3>';
		res.writeHead(200, {
			'Content-Type': 'application/json; charset=utf8'});
		res.end(JSON.stringify(pageHtml));
	};
	
	
	
	
	
};