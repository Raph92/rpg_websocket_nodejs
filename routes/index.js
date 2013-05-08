	
/*
 * GET home page.
 */

var mongoose = require('mongoose');
var Account  = mongoose.model('Account');
var Hero 	 = mongoose.model('Hero');
 
exports.index = function(req, res){
	res.render('index', {
		title : 'Web of Heroes',
		purehtml : '<p class="bold-center">Witam w grze</p>'
	});
};


exports.register = function (req, res) {
	res.render('index', {
		title : 'Rejestracja',
		purehtml : '' +  
		'<form id="reg-usr" action="/createAcc" method="post" accept-charset="utf-8">' + 
			'<table>' +
				'<tr><td><span>Login: </span></td><td><input type="text" name="login"/></td></tr>' +
				'<tr><td><span>Hasło: </span></td><td><input type="password" name="password"/></td></tr>' +
			'</table>' +
			'<button type="submit">Rejestruj</button>' +
		'</form>'
	});
};

exports.createAcc = function (req, res) {
	new Account({
		login		: req.body.login,
		password	: req.body.password,
		reg_date	: Date.now()
	}).save(function (err, account, count) {
		res.redirect('/');
	});	
};

exports.createChar = function (req, res) {
	res.render('index', {
		title : 'Stwórz postać',
		purehtml : '' +  
		'<form id="reg-usr" action="/createHero" method="post" accept-charset="utf-8">' + 
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
		'</form>'
	});
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
	Account.find( function (err, accounts, count) {
		var players = '', i = 0;
		accounts.forEach(function (account) {
			i += 1;
			players += 	'<p>Imie: ' + account.login + '</p>' +
						'<p>Hasło: ' + account.password + '</p>';
		});
		if (i === 0) {
			players += 'Aktualnie brak graczy';
		};
		res.render( 'index', {
			title : 'Lista graczy',
			purehtml : players
		});
	});
};