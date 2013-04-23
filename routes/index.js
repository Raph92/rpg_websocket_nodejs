	
/*
 * GET home page.
 */

var mongoose = require('mongoose');
var Hero 	 = mongoose.model('Hero');
 
exports.index = function(req, res){
	Hero.find(function (err, heros, count) {
		res.render('index', {
			title : 'Web of Heroes',
			heros : heros	
		});
	});
};

exports.create = function (req, res) {
	new Hero({
		nickname		: req.body.nickname,
		biography		: req.body.biography,
		reg_date		: Date.now()
	}).save(function (err, hero, count) {
		res.redirect('/');
	});	
};