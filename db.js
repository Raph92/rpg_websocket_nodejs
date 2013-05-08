var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var Account = new Schema({
	login		: String,	
	password	: String,	
	reg_date	: Date
});
mongoose.model('Account', Account);

var Hero = new Schema({
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
mongoose.model('Hero', Hero);

mongoose.connect('mongodb://localhost/');