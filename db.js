var mongoose = require('mongoose');
var Schema   = mongoose.Schema,
	crypto	 = require('crypto');


/*  
	Players table
*/
var Stalker = new Schema({
	nick		: { type: String, required: true, unique: true },
	salt		: { type: String, required: true },	
	passwdHash	: { type: String, required: true },	
	last_login	: Date,
	avatar		: String,
	level		: Number,
	points		: Number,
	faction		: String,
	str			: Number,
	acc			: Number,
	end			: Number,
	life		: Number,
	place		: String
});

// Stalker.methods.calcStats = function() {
	// this.dmg = parseInt(this.str, 10) * 1.5;
	// this.headshoot = parseInt(this.acc, 10);
	// this.life = parseInt(this.end, 10) * 20;
	// return this;
// };

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

Stalker.methods.setPassword = function(passwordString) {
    var _salt = genSalt(30);
	this.passwdHash = hash(passwordString, _salt);
	this.salt = _salt;
	return this;
};

Stalker.methods.isValidPassword = function(passwordString) {
	return this.passwdHash === hash(passwordString, this.salt);
};

mongoose.model('stalker', Stalker);

/*---------------------------------  
	Stalker Schemas for new players
---------------------------------*/
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


mongoose.connect('mongodb://localhost/');