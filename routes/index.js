'use strict';
var mongoose = require('mongoose'),
    Stalker  = mongoose.model('stalker'),
    StalkerSchema = mongoose.model('stalkerSchema'),
    EventSchema = mongoose.model('eventSchema'),
    socketio = require('socket.io'),
    cookie  =   require('cookie'),
    connect =   require('connect');

var stalkerToSocket = {},
    socketToStalker = {},
    usersAllowed = {},
    stalkerLocation = {},
    stalkerFactions = {},
    actualEvent = {
      players : {},
      time : 0,
      reward : 0,
      rewardText : '',
      penalty : 0,
      penaltyText : ''
    },
    actualBattles = {};


//------------------------------//
//       HELPER FUNCTIONS       //
//------------------------------// 

// PREPARE PLAYERS LIST TO ROOM 
var playersList = function (room) {
 var stalkersList = {};  
  for (var x in stalkerLocation) {
    if (stalkerLocation[x] === room) {
      stalkersList[socketToStalker[x]] = stalkerFactions[x];
    };
  };
  return stalkersList;
};

// STYLING DATE FOR MY FORMAT 
var parseDate = function (timeDate) {
  var date = timeDate.getDate(),
      month = parseInt(timeDate.getMonth(), 10) + 1,
      hour = parseInt(timeDate.getHours(), 10),
      minutes = parseInt(timeDate.getMinutes(), 10);
    
  if (month < 10) month = '0' + month;
  if (hour < 10) hour = '0' + hour;
  if (minutes < 10) minutes = '0' + minutes;
    
  return date + '.' + month + ', godz. ' + hour + ':' + minutes;
}; 
    
//----------------------//
//      SOCKETS.IO      //
//----------------------//
exports.listen = function(server) {
  var io = socketio.listen(server);
  io.set('log level', 1);
  
  // EVENTS START
  // setInterval( function () { 
    // makeEvent();
  // }, 600000);
  
  var makeEvent = function () {
    var availableEvents = ['radiation'],
        eventToMake = availableEvents[Math.floor(Math.random() * 10) % availableEvents.length],
        eventTime = ((Math.floor(Math.random() * 100) % 15) + 10) * 1000;
        
    var choosePlayers = function (eventType) {
      var count = 0;
      for (var x in socketToStalker) {
        count += 1;
        if ( Math.random() > 0.5 ) {
          actualEvent.players[socketToStalker[x]] = x;
        } else {
          actualEvent.players[socketToStalker[x]] = x;
        }
      };
      for (var x in actualEvent.players) {
        io.sockets.socket(actualEvent.players[x]).emit('server-event', {'name' : eventType.name, 
                                                                        'time' : eventTime});
      };
      
      setTimeout(function () {
        for (var x in actualEvent.players) {
        Stalker.findOne({ 'nick' : x}, function (err, stalker) {
          if (stalker.money > 0) {
            Stalker.findOne({ 'nick' : x}, function (err, stalker) {
            }).update(
              { $inc: { money: -100  } }
            );
          } else {
            Stalker.findOne({ 'nick' : x}, function (err, stalker) {
            }).update(
              { $set: { money: 0  } }
            );
          };
        });
        io.sockets.socket(actualEvent.players[x]).emit('event-statistics', {
                                                        'msg': eventType.penaltyText, 'stat' : 0});
      };
      
      }, eventTime);
      
    };
    var chooseEvent = function (event_data) {
      if (event_data) {
        var eventData = event_data;
        actualEvent.reward = eventData.reward;
        actualEvent.penalty = eventData.penalty;
        actualEvent.rewardText = eventData.rewardText;
        actualEvent.penaltyText = eventData.penaltyText;
        choosePlayers(eventData);
      } else {
        EventSchema.findOne({'id' : eventToMake}, function (err, eventSchema) {
          var prepare = {};  
              prepare.name        = eventSchema.name;
              prepare.time        = eventSchema.time;
              prepare.reward      = eventSchema.reward;
              prepare.rewardText  = eventSchema.rewardText;
              prepare.penalty     = eventSchema.penalty;
              prepare.penaltyText = eventSchema.penaltyText;
          chooseEvent(prepare);          
        });
      };
    };
    chooseEvent();
  };
  // END OF MAKE EVENTS
  

  /*  Authorization with SID from client cookie, SID is added to list of 
      authorized clients after succesfully login to database.             */
  io.set('authorization', function (handshakeData, accept) {
    if (handshakeData.headers.cookie) {
      handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
      handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['connect.sid'], 'secret');
      if (handshakeData.cookie['express.sid'] === handshakeData.sessionID) {
        return accept('Cookie is invalid.', false);
      }
    } else {
       return accept('No cookie transmitted.', false);
    } 
    if (usersAllowed[handshakeData.cookie]) {
      accept(null, true);
    } else {
      accept('You need login first', false);
    };
  }); 
  
  // BEGIN OF NORMAL SOCKET EVENTS
  io.sockets.on('connection', function (socket) {
    // FUNCTION FOR TRAVELING ON MAP(CHANGING ROOM)
    var placeMe = function (place) {
      if (!stalkerLocation[socket.id]) {
        stalkerLocation[socket.id] = place;
        socket.join(stalkerLocation[socket.id]);
      };
      var oldRoom = stalkerLocation[socket.id];
      stalkerLocation[socket.id] = place;
      
      socket.broadcast.to(oldRoom).emit('players-list', playersList(oldRoom));
      
      socket.leave(oldRoom);
      socket.join(stalkerLocation[socket.id]);
      
      socket.broadcast.to(stalkerLocation[socket.id]).emit('players-list', playersList(stalkerLocation[socket.id]));
      socket.emit('players-list', playersList(stalkerLocation[socket.id]));
    };
    
    
    // FUNCTION FOR GENERATE ARENA FOR BATTLE
    var mapLoad = function (socket_att, socket_def, arena_options) {
      arena_options.role = 'attacker';
      io.sockets.socket(socket_att).emit('map-load', arena_options );
      arena_options.role = 'defender';
      io.sockets.socket(socket_def).emit('map-load', arena_options );
    };
    
    // PLAYER POSITION REFRESHER
    var mapRefresh = function (socket_att, socket_def) {
    
    
    
    };
    
    /* SET OF OPERATIONS TO DO AFTER LOGIN, LINK STALKER(NICK) WITH CURRENT SOCKET ID,
       LOAD LAST VISITED LOCATION(ROOM), AND PRINT INFORMATION ABOUT LAST LOGIN TIME  */
    socket.on('connectMe', function (data) {
      var saveFaction = function (faction) {
        stalkerFactions[socket.id] = faction;
      };
      stalkerToSocket[data] = socket.id;
      socketToStalker[socket.id] = data;
     
            
      Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function (err, stalker) {
        socket.emit('msg', 'Ostatnio zalogowany: ' + parseDate(stalker.last_login));
        saveFaction(stalker.faction);
        placeMe(stalker.place);
      }).update(
        { $set: { last_login: Date.now() } }
      );
      
//       setTimeout( function () {
//         makeEvent();
//       }, 5000);
    });
    
    socket.on('rescue', function (data) {
      Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function (err, stalker) {
      }).update(
        { $inc: { money: data*10 + actualEvent.reward } }
      );
      socket.emit('event-statistics', {'msg' : actualEvent.rewardText, 'stat' : 1});
      delete actualEvent.players[socketToStalker[socket.id]];
    });

    
    //------------//
    //  FIGHTING  //
    //------------//
    socket.on('attack', function (data){
      if ( stalkerToSocket[data] !== socket.id) {
        if (!actualBattles[stalkerToSocket[data]] && !actualBattles[socketToStalker[socket.id]]) {
          var attacker = {},
              defender = {};
        
          var saveDatas = function (option, stalkerData) {
            var stalker = {};
            stalker.name = stalkerData.nick;
            stalker.faction = stalkerData.faction;
            stalker.str = stalkerData.str;
            stalker.acc = stalkerData.acc;
            stalker.end = stalkerData.end;
            stalker.att = stalker.str * 1.5;
            stalker.head = stalker.acc;
            stalker.life = stalker.end * 20;
            stalker.x = 0;
            stalker.y = 0;
            
            if (option === 0) {
              attacker = stalker;
              attacker.y = Math.floor(Math.random() * 10) % 6;
              attacker.opponent = stalkerToSocket[data];
              attacker.stat = 'attacker';
              
              Stalker.findOne({ 'nick' : data }, function (err, stalker) {
                saveDatas(1, stalker);
              });
            } else {
              defender = stalker;
              defender.x = 11;
              defender.y = Math.floor(Math.random() * 10) % 6;
              defender.opponent = socket.id;
              defender.stat = 'defender';
              
              actualBattles[socket.id] = attacker;
              actualBattles[stalkerToSocket[data]] = defender;
              
              var arena_options = {
                att_x : attacker.x,
                att_y : attacker.y,
                att_faction : attacker.faction,
                def_x : defender.x,
                def_y : defender.y,
                def_faction : defender.faction
              };
              
              io.sockets.socket(stalkerToSocket[data]).emit('battle', { 
                who: socketToStalker[socket.id] } );
              
              mapLoad(socket.id, stalkerToSocket[data], arena_options);
            };
          };
          
          Stalker.findOne({ 'nick' : socketToStalker[socket.id] }, function (err, stalker) {
            saveDatas(0, stalker);
          });
          
        } else {
          socket.emit('opponent-in-battle', data + ' aktualnie zmaga się z kim innym, jako ' + 
                      'honorowy stalker, dajesz mu jeszcze chwilę');
        }
      };
    });
    
    
    socket.on('move', function (data) {
      var x = actualBattles[socket.id].x,
          y = actualBattles[socket.id].y;
    
      if (data === 'left' ) {
        if (x > 0) {
          if (actualBattles[actualBattles[socket.id].opponent].x !== x - 1 || 
              actualBattles[actualBattles[socket.id].opponent].y !== y) {
             actualBattles[socket.id].x -= 1;
          };
        };
      } else if (data === 'right') {
        if (x < 11) {
           if (actualBattles[actualBattles[socket.id].opponent].x !== x + 1 ||
               actualBattles[actualBattles[socket.id].opponent].y !== y) {
             actualBattles[socket.id].x += 1;
           };
        };
      } else if (data === 'up') {
          if (y > 0) {
            if (actualBattles[actualBattles[socket.id].opponent].y !== y - 1 ||
                actualBattles[actualBattles[socket.id].opponent].x !== x) {
              actualBattles[socket.id].y -= 1;
            };
          };
      } else if (data === 'down') {
          if(y < 5) {
            if (actualBattles[actualBattles[socket.id].opponent].y !== y + 1 ||
                actualBattles[actualBattles[socket.id].opponent].x !== x) {
              actualBattles[socket.id].y += 1;
            };
          };
      };
    
      
      var playerCords = {
          'stat' : actualBattles[socket.id].stat,
          'x' : actualBattles[socket.id].x,
          'y' : actualBattles[socket.id].y
      };
    
      socket.emit('on-move', playerCords);
      io.sockets.socket(actualBattles[socket.id].opponent).emit('on-move', playerCords);
      
      console.log(playerCords);
    
    });
    
    
    //---------------//
    //   TRAVELING   //
    //---------------//
    socket.on('travel', function (data) {
      Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function(err,stalkers){})
             .update(
               { $set: { place: data.where } }
             );
      placeMe(data.where);
    });
    
    socket.on('shooping', function (data) {
      Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function(err,stalkers){
        if (data === 'weapon' || data === 'armor' || data === 'scope') {
          if (stalkers.money >= 500) {
            var upd;
            if(data === 'weapon') {
              upd = { money: -500, weapon: 1, str: 1};
            } else if (data === 'scope') {
              upd = { money: -500, scope: 1, acc: 1};
            } else {
              upd = { money: -500, armor: 1, end: 1, life: 20};
            };
            Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function(err,stalkers){})
                   .update(
                     { $inc: upd }
                   );
            socket.emit('shopping-result', 1);
          } else {
            socket.emit('shopping-result', 0);
          };
        } else {
          var upd;
          if (stalkers.money >= 50) {
            if(data === 'energetic') {
              upd = { money: -50, energetic: 1 };
            } else {
              upd = { money: -50, vodka: 1 };
            };
            Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function(err,stalkers){})
                   .update(
                     { $inc:  upd  }
                   );
            socket.emit('shopping-result', 1);
          } else {
            socket.emit('shopping-result', 0);
          };
        };
      });
    });
    
    socket.on('msg', function (data){
        io.sockets.to(stalkerLocation[socket.id]).emit('msg', socketToStalker[socket.id] + ': ' + data);
    });
    
    socket.on('disconnect', function () {
      delete stalkerToSocket[socketToStalker[socket.id]];
      delete socketToStalker[socket.id];
      var oldRoom = stalkerLocation[socket.id];
      delete stalkerLocation[socket.id];
      delete stalkerFactions[socket.id];
      
      socket.broadcast.to(oldRoom).emit('players-list', playersList(oldRoom));
    });
  });
};

//-----------------------------------//
//       SENDING SESSION DATA        //
//-----------------------------------//
exports.socketConnect = function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf8'});
  res.end(JSON.stringify(req.session.account));
};

// MAIN PAGE
exports.index = function(req, res){
  var pageHtml = '',
      statistics = '';
  if (!req.session.account) {
    pageHtml = '<div id="index"><p class="bold-center">Witam w grze</p>' +
                '<form action="/login" method="post" accept-charset="utf-8">' + 
                  '<table>' +
                  '<tr><td><span>Login: </span></td><td><input class="text_input" type="text" name="login"/></td></tr>' +
                  '<tr><td><span>Hasło: </span></td><td>' + 
                  '<input class="text_input" type="password" name="password"/></td></tr>' +
                '</table>' +
                '<button class="button_input" type="submit">Zaloguj</button>' +
                '</form>' + 
                '<p>Jeśli nie masz jeszcze postaci, zarejestruj się</p>' + 
                '<form id="register-form" action="/create-character" method="get"><button class="button_input"' +
                'type="submit">Rejestracja</button></form></div>';
  };
  res.render('index', {
    gaming : pageHtml
  });
};

// LOGIN FORM
exports.login = function (req, res) {
  Stalker.findOne({ 'nick' : req.body.login}, function (err, stalker) {
    var pageHtml = '',
        purehtml = '<div id="index"><form action="/login" method="post" accept-charset="utf-8">' + 
                    '<table>' +
                      '<tr><td><span>Login: </span></td><td><input class="text_input" type="text" name="login"/></td></tr>' +
                      '<tr><td><span>Hasło: </span></td><td><input class="text_input" type="password" name="password"/></td></tr>' +
                    '</table>' +
                    '<button class="button_input" id="login_btn" type="submit">Zaloguj</button>' +
                  '</form></div>';
    if (stalker) {
      if (stalker.isValidPassword(req.body.password)) {
          // INITIALIZE EXPRESS SESSION
          req.session.account = stalker.nick;
          usersAllowed[req.cookies] = stalker.nick;
          res.redirect('/');
      } else {
        pageHtml = '<div id="index"><h3>Błędne hasło, spróbuj jeszcze raz</h3></div>';
        res.render('index', {
          gaming : pageHtml
        });
      }
    } else {
      pageHtml = '<div id="index"><h3>Podany gracz nie istnieje, spróbuj jeszcze raz</h3></div>';
      res.render('index', {
        gaming : pageHtml
      });
    };
  });
};

// LOGOUT
exports.logout = function (req, res) {
  if (req.session.account) {
    delete socketToStalker[stalkerToSocket[req.session.account]];
    delete stalkerToSocket[req.session.account];
      for (var x in usersAllowed) {
        if(usersAllowed[x] === req.session.account) {
          delete usersAllowed[x];
        }
      };
  req.session.account = null;
  };
  res.redirect('/');
};

// CREATE STALKER FORM
exports.createChar = function (req, res) {
  var img = '';
  for(var i = 0; i < 6; i += 1){
    img += "<img src=\"../images\\avatar_" + i + ".jpg\" class=\"avatars\"/>";
  };
  var pageHtml = '';
  if (!req.session.account) {
    pageHtml = '<div id="create-character"><form id="crt-char-form" action="/create-stalker" method="post"' +
    'accept-charset="utf-8">' + 
      '<table>' +
        '<tr><td></td><td></td><td rowspan=7><input type="hidden" name="avatar"/>' + 
        '<img id="avatar" src="../images/avatar_none.jpg"/><br/><img id="faction" ' +
        'src="../images/avatar_none.jpg"/></td></tr>' +
        '<tr><td><span>Imie: </span></td><td><input type="text" name="nickname" class="text_input"/></td></tr>' +
        '<tr><td><span>Hasło: </span></td><td><input type="password" name="password" class="text_input"/></td></tr>' +
        '<tr><td><span>Frakcja: </span></td><td>' +
        '<select class="select_input" name="faction" form="crt-char-form">' +
        '<option value="loners">Stalkerzy</option><option value="freedom">Wolność</option>' +
        '<option value="duty">Powinność</option>' +
        '</select></td></tr>' +
        '<tr><td><span>Siła: </span><img class="stat-icons" src="../images/str_icon.png"></td>' + 
        '<td><span></span><input type="hidden" name="strength"/>' +
        '<img name="plus" src="../images/plus.png" class="stats-btn"/>' + 
        '<img name="minus" src="../images/minus.png" class="stats-btn"/></td></tr>' +
        '<tr><td><span>Celność: </span><img class="stat-icons" src="../images/acc_icon.png"></td>' + 
        '<td><span></span><input type="hidden" name="accuracy"/>' +
        '<img name="plus" src="../images/plus.png" class="stats-btn"/>' +
        '<img name="minus" src="../images/minus.png" class="stats-btn"/></td></tr>' +
        '<tr><td><span>Wytrzymałość: </span><img class="stat-icons" ' + 
        'src="../images/end_icon.png"></td><td><span></span><input type="hidden" name="endurance"/>' +
        '<img name="plus" src="../images/plus.png" class="stats-btn"/>' +
        '<img name="minus" src="../images/minus.png" class="stats-btn"/></td></tr>' +
        '<tr><td><span>Punkty: </span><img class="stat-icons" src="../images/points_icon.png"></td>' +
        '<td><span></span><input type="hidden" name="points"/></td></tr>' +
      '</table>' +
      '<button class="button_input" type="submit">Stwórz postać</button></form>' +
      '<div style=\"display : none;" id="avatars_choose">' + img + 
      '<img id="close_popup" src="../images/close.png"></div></div>';
      res.render('index', {
        gaming : pageHtml
      });
  } else {
    pageHtml = '<div id="create-character"><h3>Wyloguj się nim stworzysz kolejną postać</h3></div>';
    res.render('index', {
      gaming : pageHtml
    });
  };
};

// GET CHARACTER SCHEMA FOR CHOOSE FACTION
exports.getCharacterSchema = function (req, res) {
  StalkerSchema.findOne({ 'name' : req.query.faction }, function (err, stalkerschemas) {
    var schema = { 'image' : stalkerschemas.image, 'str' : stalkerschemas.str, 'acc' : stalkerschemas.acc, 
            'end' : stalkerschemas.end, 'points' : stalkerschemas.points };
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf8'});
    res.end(JSON.stringify(schema));
  });
};

// CREATE STALKER - MONGO FUNCTION
exports.createStalker = function (req, res) {
  new Stalker({
    nick          : req.body.nickname,
    avatar        : req.body.avatar,
    last_login    : Date.now(),
    level         : 1,
    money         : 100,
    points        : 0,
    faction       : req.body.faction,
    str           : parseInt(req.body.strength, 10),
    acc           : parseInt(req.body.accuracy, 10),
    end           : parseInt(req.body.endurance, 10),
    life          : parseInt(req.body.endurance, 10) * 20,
    place         : 'rostok',
    weapon        : 0,
    armor         : 0,
    scope         : 0,
    energetic     : 0,
    vodka         : 0
  }).setPassword(req.body.password)
    .save(function (err, count) {
    if (err) {
      if (err.code === 11000) {
        res.render('index', {
          gaming : 'Istnieje już postać o takim nicku'
        });
      };
    } else {
      res.redirect('/');
    };
  });  
  
};
//-------------------------------------------//
//  GENERATE AND SEND STATISTICS FOR PLAYER  //
//-------------------------------------------//
exports.statistics = function (req, res) {
  if (req.session.account) {
    Stalker.findOne({'nick' : req.session.account}, function (err, stalkers){
      var statHTML = '';
      if(stalkers) {
        var statistics = {
          avatar  : stalkers.avatar,
          faction : stalkers.faction,
          nick    : stalkers.nick,
          level   : stalkers.level,
          dmg     : parseInt(stalkers.str, 10) * 1.5,
          head    : parseInt(stalkers.acc, 10),
          life    : stalkers.life + '/' + parseInt(stalkers.end) * 20,
          str     : stalkers.str,
          acc     : stalkers.acc,
          end     : stalkers.end,
          money   : stalkers.money,
          place   : stalkers.place,
          weapon  : stalkers.weapon,
          armor   : stalkers.armor,
          scope   : stalkers.scope,
          energetic : stalkers.energetic,
          vodka   : stalkers.vodka
        };
      };
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf8'});
      res.end(JSON.stringify(statistics));
    });
  } else {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf8'});
    res.end(JSON.stringify('Najpierw musisz się zalogować'));
  };
};
