var mongoose = require('mongoose');
var Schema   = mongoose.Schema,
	crypto	 = require('crypto');

var Account = new Schema({
	login		: { type: String, required: true, unique: true },
	salt		: { type: String, required: true },	
	passwdHash	: { type: String, required: true },	
	reg_date	: Date,
	last_login	: Date
});

var hash = function(passwd, salt) {
    return crypto.createHmac('sha256', salt).update(passwd).digest('hex');
};

var genSalt = function (count) {
	var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-';
	var mySalt = '';
	
	for (var i = 0; i < count; i += 1) {
		mySalt += chars[Math.floor(Math.random()*100) % 63];
	};
	return mySalt;
};

Account.methods.setPassword = function(passwordString) {
    var _salt = genSalt(30);
	this.passwdHash = hash(passwordString, _salt);
	this.salt = _salt;
	return this;
};

Account.methods.isValidPassword = function(passwordString) {
	return this.passwdHash === hash(passwordString, this.salt);
};

mongoose.model('account', Account);

var Stalker = new Schema({
	nickname	: String,
	avatar		: String,
	level		: String,
	exp			: String,
	race		: String,
	prof		: String,
	strength	: String,
	agility		: String,
	endurance	: String,
	magic		: String,
	lucky		: String,
	dmg			: String,
	crit		: String,
	hp			: String,
	mana		: String,	
	reg_date	: Date
});
mongoose.model('stalker', Stalker);

mongoose.connect('mongodb://localhost/');