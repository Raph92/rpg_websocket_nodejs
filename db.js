var mongoose = require('mongoose');
var Schema   = mongoose.Schema,
	crypto	 = require('crypto');


/* 
	Account DB schema
*/
var Account = new Schema({
	login		: { type: String, required: true, unique: true },
	salt		: { type: String, required: true },	
	passwdHash	: { type: String, required: true },	
	reg_date	: Date,
	last_login	: Date
});

/* 
	Password Hashing
*/
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

var Account = mongoose.model('account');

/*  
	Stalker Schemas for new players
*/
var StalkerSchema = new Schema({
	id		: String,
	name	: String,
	image	: String,
	str		: String,
	acc 	: String,
	end		: String,
	points	: String
});
mongoose.model('stalkerSchema', StalkerSchema);

var StalkerSchema = mongoose.model('stalkerSchema');

/*  
	Inserts into stalker schemas
*/
var createStalkerSchemas = function() {
	new StalkerSchema({	id : '1', name : 'loners', image: '../images/faction_loners.png', str : 5, acc : 7, end : 6, points : 5 })
		.save(function (err, stalkerSchema, count) {});
	new StalkerSchema({	id : '2', name : 'freedom', image: '../images/faction_freedom.png', str : 6, acc : 6, end : 6, points : 5 })
		.save(function (err, stalkerSchema, count) {});
	new StalkerSchema({	id : '3', name : 'duty', image: '../images/faction_duty.png', str : 7, acc : 5, end : 6, points : 5 })
		.save(function (err, stalkerSchema, count) {});
};
// createStalkerSchemas();



/*  
	Players table
*/
var Stalker = new Schema({
	nick		: { type: String, required: true, unique: true },
	avatar		: String,
	level		: String,
	faction		: String,
	str			: String,
	acc			: String,
	end			: String,
	dmg			: String,
	headshoot	: String,
	life		: String,
	account		: String,
	equipment	: String,
	skills		: String
});

Stalker.methods.calcStats = function() {
	this.dmg = parseInt(this.str, 10) * 1,5;
	this.headshoot = parseInt(this.acc, 10);
	this.life = parseInt(this.end, 10) * 20;
	return this;
};


mongoose.model('stalker', Stalker);

mongoose.connect('mongodb://localhost/');