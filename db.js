var mongoose = require('mongoose');
var Schema   = mongoose.Schema,
    crypto   = require('crypto');

  
// PLAYERS TABLE
var Stalker = new Schema({
  nick        : { type: String, required: true, unique: true },
  salt        : { type: String, required: true },  
  passwdHash  : { type: String, required: true },  
  last_login  : Date,
  avatar      : String,
  level        : Number,
  money        : Number,
  points      : Number,
  faction      : String,
  str          : Number,
  acc          : Number,
  end          : Number,
  life        : Number,
  place        : String,
  weapon      : Number,
  armor       : Number,
  scope       : Number,
  energetic   : Number,
  vodka       : Number,
  firstaid    : Number
});
// Stalker.methods.calcStats = function() {
  // this.dmg = parseInt(this.str, 10) * 1.5;
  // this.headshoot = parseInt(this.acc, 10);
  // this.life = parseInt(this.end, 10) * 20;
  // return this;
// };


// PASSWORD HASHING
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

//-----------------------------------//
//  STALKER SCHEMAS FOR NEW PLAYERS  //
//-----------------------------------//
var StalkerSchema = new Schema({
  id    : String,
  name  : String,
  image  : String,
  str    : String,
  acc   : String,
  end    : String,
  points  : String
});
mongoose.model('stalkerSchema', StalkerSchema);

var StalkerSchema = mongoose.model('stalkerSchema');

// INSERTS INTO STALKER SCHEMAS
var createStalkerSchemas = function() {
  new StalkerSchema({  name : 'loners', image: '../images/faction_loners.png', str : 5, acc : 7, end : 6, points : 5 })
    .save(function (err, stalkerSchema, count) {});
  new StalkerSchema({  name : 'freedom', image: '../images/faction_freedom.png', str : 6, acc : 6, end : 6, points : 5 })
    .save(function (err, stalkerSchema, count) {});
  new StalkerSchema({  name : 'duty', image: '../images/faction_duty.png', str : 7, acc : 5, end : 6, points : 5 })
    .save(function (err, stalkerSchema, count) {});
};
// createStalkerSchemas();

var EventSchema = new Schema({
  id          : String,
  name        : String,
  time        : Number,
  reward      : Number,
  rewardText  : String,
  penalty     : Number,
  penaltyText : String,
});
mongoose.model('eventSchema', EventSchema);
var EventSchema = mongoose.model('eventSchema');

var createEventSchemas = function () {
  new EventSchema({
    id          : 'radiation',
    name        : 'Wyładowanie',
    reward      : 100,
    rewardText  : 'Przeżyłeś, udało Ci się schować na czas, ten za nami nie miał tyle szczęścia, ale za to zgubił niezłego fanta, ' +
                  'trzymaj, podzielimy się.',
    penalty     : 200,
    penaltyText : 'Ocknij się, masz szczęście, że żyjesz, było ogromne wyładowanie, widać Tobie nie udało się dotrzeć na czas, ' +
                  'grupka stalkerów w kombinezonach znalazła Cię ledwo żywego, donieśli Cię, aż tutaj, trochę Cię to kosztowało, ' +
                  'ale przynajmniej żyjesz.'
  }).save(function (err, eventSchema, count) {});
};

// createEventSchemas();

mongoose.connect('mongodb://localhost');