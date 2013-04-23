var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var Hero = new Schema({
	nickname	: String,
	biography	: String,
	reg_date	: Date
});

mongoose.model('Hero', Hero);

mongoose.connect('mongodb://localhost/');