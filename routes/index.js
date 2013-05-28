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
    stalkersInBattle = {},
    actualEvent = {
      players : {},
      time : 0,
      reward : 0,
      rewardText : '',
      penalty : 0,
      penaltyText : ''
    },
    fightCount = 0;


//------------------------------//
//       HELPER FUNCTIONS       //
//------------------------------// 

// PREPARE PLAYERS LIST TO ROOM 
var playersList = function (room) {
  var stalkersList = [];  
  for (var x in stalkerLocation) {
    if (stalkerLocation[x] === room) {
      stalkersList.push(socketToStalker[x]);
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
        }).update(
          { $inc: { money: -100  } }
        );
        io.sockets.socket(actualEvent.players[x]).emit('event-statistics', {'msg': eventType.penaltyText, 'stat' : 0});
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
      if (place) {
        if (!stalkerLocation[socket.id]) {
          stalkerLocation[socket.id] = place;
          socket.join(stalkerLocation[socket.id]);
        };
        var oldRoom = stalkerLocation[socket.id];
        socket.broadcast.to(oldRoom).emit('players-list', playersList(oldRoom));
        
        stalkerLocation[socket.id] = place;
        socket.leave(oldRoom);
        socket.join(stalkerLocation[socket.id]);
        
        socket.broadcast.to(stalkerLocation[socket.id]).emit('players-list', playersList(stalkerLocation[socket.id]));
        socket.emit('players-list', playersList(stalkerLocation[socket.id]));
      } else {
        Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function(err,stalkers){
          placeMe(stalkers.place);
        });
      };
    };
  
    /* Set of operations to do after login, link stalker(nick) with current socket id,
       load last visited location(room), and print information about last login time  */
    socket.on('connectMe', function (data) {
      stalkerToSocket[data] = socket.id;
      socketToStalker[socket.id] = data;
      placeMe();
      Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function (err, stalker) {
        socket.emit('msg', 'Ostatnio zalogowany: ' + parseDate(stalker.last_login));
      }).update(
        { $set: { last_login: Date.now() } }
      );
      setTimeout( function () {
        makeEvent();
      }, 5000);
    });
    
    socket.on('rescue', function (data) {
      Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function (err, stalker) {
      }).update(
        { $inc: { money: data*10 + actualEvent.reward } }
      );
      socket.emit('event-statistics', {'msg' : actualEvent.rewardText, 'stat' : 1});
      delete actualEvent.players[socketToStalker[socket.id]];
    });

    // FIGHTS
    socket.on('fightWithMe', function (data){
      // var room = socketToStalker[socket.id] + '/' + data;
      // stalkersInBattle[socket.id] = room;
      if ( stalkerToSocket[data] !== socket.id) {
        io.sockets.socket(stalkerToSocket[data]).emit('wantYouFight', { who: socketToStalker[socket.id] } );
      };
      // socket.join(room);
      
      
      
      
      
      
      
      
      
      
      
      
      
      
    });
    
    socket.on('travel', function (data) {
      Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function(err,stalkers){})
             .update(
               { $set: { place: data.where } }
             );
      placeMe(data.where);
    });
    
    socket.on('msg', function (data){
        io.sockets.to(stalkerLocation[socket.id]).emit('msg', socketToStalker[socket.id] + ': ' + data);
    });
    
    socket.on('disconnect', function () {
      delete stalkerToSocket[socketToStalker[socket.id]];
      delete socketToStalker[socket.id];
      var oldRoom = stalkerLocation[socket.id];
      delete stalkerLocation[socket.id];
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
    pageHtml = '<div id="create-character"><form id="crt-char-form" action="/create-stalker" method="post" accept-charset="utf-8">' + 
      '<table>' +
        '<tr><td></td><td></td><td rowspan=7><input type="hidden" name="avatar"/>' + 
        '<img id="avatar" src="../images/avatar_none.jpg"/><br/><img id="faction" src="../images/avatar_none.jpg"/></td></tr>' +
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
        '<tr><td><span>Wytrzymałość: </span><img class="stat-icons" src="../images/end_icon.png"></td><td><span></span><input type="hidden" name="endurance"/>' +
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
    nick        : req.body.nickname,
    avatar      : req.body.avatar,
    last_login  : Date.now(),
    level        : 1,
    money        : 100,
    points      : 0,
    faction      : req.body.faction,
    str          : parseInt(req.body.strength, 10),
    acc          : parseInt(req.body.accuracy, 10),
    end          : parseInt(req.body.endurance, 10),
    life        : parseInt(req.body.endurance, 10) * 20,
    place        : 'rostok',
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
      var pageHtml = '';
      if(stalkers) {
        pageHtml += '<table><tr><td></td><td></td><td rowspan=8><img class="avatars" src="' + stalkers.avatar + '"/>';
        pageHtml += '<br/><img class="avatars" src="../images/faction_' + stalkers.faction + '.png"/></td></tr>';
        pageHtml += '<tr><td>Imię</td><td>' + stalkers.nick + '</td></tr>';
        pageHtml += '<tr><td>Poziom</td><td>' + stalkers.level + '</td></tr>';
        pageHtml += '<tr><td>Dmg: </td><td>' + parseInt(stalkers.str, 10) * 1,5 + '</td></tr>';
        pageHtml += '<tr><td>Headshoot: </td><td>' + parseInt(stalkers.acc, 10) + '%</td></tr>';
        pageHtml += '<tr><td>Życie: </td><td>' + stalkers.life + '/' + parseInt(stalkers.end) * 20 + ' HP</td></tr>';
        pageHtml += '<tr><td colspan=2><img class="stat-icons" src="../images/str_icon.png"/>' + stalkers.str;
        pageHtml += '<img class="stat-icons" src="../images/acc_icon.png"/>' + stalkers.acc;
        pageHtml += '<img class="stat-icons" src="../images/end_icon.png"/>' + stalkers.end + '</td></tr>';
        pageHtml += '<tr><td colspan=2><img class="stat-icons" src="../images/money.png"/>' + stalkers.money + ' RU</td></tr></table>';
        pageHtml += '<span style="visibility: hidden">' + stalkers.place + '</span>';
      };
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf8'});
      res.end(JSON.stringify(pageHtml));
    });
  } else {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf8'});
    res.end(JSON.stringify('Najpierw musisz się zalogować'));
  };
};
