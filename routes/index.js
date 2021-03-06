var mongoose = require('mongoose'),
  Stalker  = mongoose.model('stalker'),
  StalkerSchema = mongoose.model('stalkerSchema'),
  EventSchema = mongoose.model('eventSchema'),
  socketio = require('socket.io'),
  cookie  =   require('cookie'),
  connect =   require('connect');

var stalkerToSocket = {}, 
  socketToStalker = {},
  usersAllowed = {}, // [Cookie name : sid] : login
  stalkerLocation = {}, // ID : LOCATION
  stalkerFactions = {}, // ID : FACTION
  actualEvent = {
    players : {}, // LOGIN : ID
    time : 0,
    reward : 0,
    rewardText : '',
    penalty : 0,
    penaltyText : ''
  },
  actualBattles = {}; // name, faction, str, acc, end, att, head, life, x, y, opponent, stat

  
//------------------------------//
//       HELPER FUNCTIONS       //
//------------------------------// 

/* PREPARE PLAYERS LIST TO ROOM  */
var playersList = function (room) {
  var stalkersList = {},
    x;
  for (x in stalkerLocation) {
    if (stalkerLocation[x] === room) {
      stalkersList[socketToStalker[x]] = stalkerFactions[x];
    }
  }
  return stalkersList;
};

/* STYLING DATE FOR MY FORMAT */
var parseDate = function (timeDate) {
  var date = timeDate.getDate(),
    month = parseInt(timeDate.getMonth(), 10) + 1,
    hour = parseInt(timeDate.getHours(), 10),
    minutes = parseInt(timeDate.getMinutes(), 10);
  if (month < 10) {
    month = '0' + month;
  }
  if (hour < 10) {
    hour = '0' + hour;
  }
  if (minutes < 10) {
    minutes = '0' + minutes;
  }
  return date + '.' + month + ', godz. ' + hour + ':' + minutes;
};
//----------------------//
//      SOCKETS.IO      //
//----------------------//
exports.listen = function (server) {
  var io = socketio.listen(server);
  io.set('log level', 1);
  /* MAKE EVENT, GET RANDOM EVENTS(NOW ONE), GET RANDOM PLAYERS, AND SEND MONSTERS TO THEM */
  var makeEvent = function () {
    var availableEvents = ['radiation'],
      eventToMake = availableEvents[Math.floor(Math.random() * 10) % availableEvents.length],
      eventTime = ((Math.floor(Math.random() * 100) % 15) + 10) * 1000,
      choosePlayers = function (eventType) {
        var count = 0,
          x;
        for (x in socketToStalker) {
          count += 1;
          if (Math.random() > 0.5) {
            if (!actualBattles[x]) {
              actualEvent.players[socketToStalker[x]] = x;
            }
          }
        }
        for (x in actualEvent.players) {
          io.sockets.socket(actualEvent.players[x]).emit('server-event', {'name' : eventType.name,
                                                                          'time' : eventTime});
        }
        setTimeout(function () {
          var x;
          for (x in actualEvent.players) {
            Stalker.findOne({ 'nick' : x}, function (err, stalker) {
              if (stalker.money >= 100) {
                Stalker.update({'nick' : x},
                    { $inc: { money: -100 }}, function () {});
              } else {
                Stalker.update({'nick' : x},
                    { $inc: { money: 0 }}, function () {});
              }
            });
            io.sockets.socket(actualEvent.players[x]).emit('event-statistics', {
              'msg': eventType.penaltyText,
              'stat' : 0
            });
          }
          actualEvent.players = {};
        }, eventTime);
      }, /* GET EVENT DATA FROM DB, AND PUT IT TO ACTUAL EVENT OBJECT, AFTER END, RUN CHOOSE PLAYERS*/
      chooseEvent = function (event_data) {
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
        }
      };
    chooseEvent();
  };
  /* EVENT LOOP */
  setInterval(function () {
    makeEvent();
  }, 120000);

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
    if (usersAllowed[handshakeData.cookie]) { // IF USER SID IS IN USERSALLOWED, USER WAS LOGGED(AUTHORIZED)
      accept(null, true);
    } else {
      accept('You need login first', false);
    }
  });
  
  /* BEGIN OF NORMAL SOCKET EVENTS */
  io.sockets.on('connection', function (socket) {
    /* FUNCTION FOR TRAVELING ON MAP(CHANGING ROOM) */
    var placeMe = function (place) {
      if (!stalkerLocation[socket.id]) {
        stalkerLocation[socket.id] = place;
        socket.join(stalkerLocation[socket.id]);
      }
      var oldRoom = stalkerLocation[socket.id];
      stalkerLocation[socket.id] = place;
      socket.broadcast.to(oldRoom).emit('players-list', playersList(oldRoom));
      socket.leave(oldRoom);
      socket.join(stalkerLocation[socket.id]);
      socket.broadcast.to(stalkerLocation[socket.id]).
        emit('players-list', playersList(stalkerLocation[socket.id]));
      socket.emit('players-list', playersList(stalkerLocation[socket.id]));
    }, /* BATTLE SUMMARY, NEED TO RUN THIS WHEN FIGHT CAN END, (0 HP OR DISCONNECT) */
      fightStatus = function (winner_socket, walkover_status) {
        if (!walkover_status) { // NORMAL FIGHT END
          var loser_socket = actualBattles[winner_socket].opponent;
          delete actualBattles[winner_socket];
          delete actualBattles[loser_socket];
          Stalker.update({'nick' : socketToStalker[winner_socket]}, // + MONEY, AND IF LEVEL IS EVEN, SKILL POINTS
            { $inc: { money: 200, level: 1}}, function () {
              Stalker.findOne({'nick': socketToStalker[winner_socket]}, function (err, stalker) {
                if (stalker.level % 2 === 0) {
                  Stalker.update({'nick' : socketToStalker[winner_socket]},
                    { $inc: { points: 1 }}, function () {});
                }
              });
              io.sockets.socket(winner_socket).
                emit('fight-result', {'msg' : 'Wygrałeś, oto Twoje pieniądze', 'stat' : 1});
            });
          Stalker.findOne({ 'nick' : socketToStalker[loser_socket]}, function (err, stalker) { // - MONEY
            var loser_data = {'msg' : 'Niestety, Twój przeciwnik okazał się silniejszy, ' +
                 'tak czy siak muszę wziąść swoją dolę na potrzeby zakładu.', 'stat' : 0};
            if (stalker.money >= 200) {
              Stalker.update({'nick' : socketToStalker[loser_socket]},
                { $inc: { money: -200 }}, function () {
                  io.sockets.socket(loser_socket).
                    emit('fight-result', loser_data);
                });
            } else {
              Stalker.update({'nick' : socketToStalker[loser_socket]},
                { $set: { money: 0 }}, function () {
                  io.sockets.socket(loser_socket).
                    emit('fight-result', loser_data);
                });
            }
          });
        } else { // WALKOVER FIGHT END
          var win_with_walkover_socket = actualBattles[winner_socket].opponent,
            disconnected_nick = socketToStalker[winner_socket];
          delete actualBattles[winner_socket];
          delete actualBattles[win_with_walkover_socket];
          Stalker.update({'nick' : socketToStalker[win_with_walkover_socket]},
            { $inc: { money: 200 }}, function () {
              io.sockets.socket(win_with_walkover_socket).
                emit('fight-result', {msg : 'Twój przeciwnik uciekł, na szczęście zgubił trochę kasy.',
                                      stat : 1});
            });
          Stalker.findOne({ 'nick' : disconnected_nick}, function (err, stalker) {
            if (stalker.money >= 200) {
              Stalker.update({'nick' : disconnected_nick}, { $inc: { money: -200 }}, function () {});
            } else {
              Stalker.update({'nick' : disconnected_nick}, { $set: { money: 0 }}, function () {});
            }
          });
        }
      };
    /* SET OF OPERATIONS TO DO AFTER LOGIN, LINK STALKER(NICK) WITH CURRENT SOCKET ID,
       LOAD LAST VISITED LOCATION(ROOM), AND PRINT INFORMATION ABOUT LAST LOGIN TIME  */
    socket.on('connectMe', function (data) {
      var saveFaction = function (faction) {
        stalkerFactions[socket.id] = faction;
      };
      stalkerToSocket[data] = socket.id;
      socketToStalker[socket.id] = data;
      if (socketToStalker[socket.id]) {
        Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function (err, stalker) {
          socket.emit('msg', 'Ostatnio zalogowany: ' + parseDate(stalker.last_login));
          saveFaction(stalker.faction);
          placeMe(stalker.place);
        }).update(
          { $set: { last_login: Date.now() } }
        );
      }
    });
    /* RECEIVED WHEN USER FIND BUNKER IN EVENT */
    socket.on('rescue', function (data) {
      Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function (err, stalker) {
      }).update(
        { $inc: { money: data * 10 + actualEvent.reward } }
      );
      socket.emit('event-statistics', {'msg' : actualEvent.rewardText, 'stat' : 1});
      delete actualEvent.players[socketToStalker[socket.id]];
    });

    //------------//
    //  FIGHTING  //
    //------------//
    socket.on('attack', function (data) {
      /* FUNCTION FOR SEND ARENA DATA TO FIGHTERS */
      var mapLoad = function (socket_att, socket_def, arena_options) {
        arena_options.role = 'attacker';
        io.sockets.socket(socket_att).emit('map-load', arena_options);
        arena_options.role = 'defender';
        io.sockets.socket(socket_def).emit('map-load', arena_options);
      };
      if (stalkerToSocket[data] !== socket.id) {
        /* IF I AND OPPONENT ARE NOT IN EVENT AND NOT IN BATTLE */
        if (!actualBattles[stalkerToSocket[data]] && !actualBattles[socketToStalker[socket.id]] &&
            !actualEvent.players[data] && !actualEvent.players[socketToStalker[socket.id]]) {
          var attacker = {},
            defender = {},
            saveDatas = function (option, stalkerData) {
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
              stalker.skill = '';
              if (option === 0) {
                attacker = stalker;
                attacker.y = Math.floor(Math.random() * 10) % 5;
                attacker.opponent = stalkerToSocket[data];
                attacker.stat = 'attacker';
                Stalker.findOne({ 'nick' : data }, function (err, stalker) {
                  saveDatas(1, stalker);
                });
              } else {
                defender = stalker;
                defender.x = 11;
                defender.y = Math.floor(Math.random() * 10) % 5;
                defender.opponent = socket.id;
                defender.stat = 'defender';
                actualBattles[socket.id] = attacker;
                actualBattles[stalkerToSocket[data]] = defender;
                var arena_options = {
                  att_x : attacker.x,
                  att_y : attacker.y,
                  att_faction : attacker.faction,
                  att_life  : attacker.life,
                  att_nick  : attacker.name,
                  def_x : defender.x,
                  def_y : defender.y,
                  def_faction : defender.faction,
                  def_life  : defender.life,
                  def_nick  : defender.name
                };
                io.sockets.socket(stalkerToSocket[data]).emit('battle', {
                  who: socketToStalker[socket.id]
                });
                mapLoad(socket.id, stalkerToSocket[data], arena_options);
              }
            };
          Stalker.findOne({ 'nick' : socketToStalker[socket.id] }, function (err, stalker) {
            saveDatas(0, stalker);
          });
        } else {
          socket.emit('opponent-in-battle', data + ' aktualnie zmaga się na arenie z kim innym, lub jest zajęty');
        }
      }
    });
    socket.on('move', function (data) {
      if (actualBattles[socket.id]) {
        var x = actualBattles[socket.id].x,
          y = actualBattles[socket.id].y;
        if (data === 'left') {
          if (x > 0) {
            if (actualBattles[actualBattles[socket.id].opponent].x !== x - 1 ||
                actualBattles[actualBattles[socket.id].opponent].y !== y) {
              actualBattles[socket.id].x -= 1;
            }
          }
        } else if (data === 'right') {
          if (x < 11) {
            if (actualBattles[actualBattles[socket.id].opponent].x !== x + 1 ||
                 actualBattles[actualBattles[socket.id].opponent].y !== y) {
              actualBattles[socket.id].x += 1;
            }
          }
        } else if (data === 'up') {
          if (y > 0) {
            if (actualBattles[actualBattles[socket.id].opponent].y !== y - 1 ||
                actualBattles[actualBattles[socket.id].opponent].x !== x) {
              actualBattles[socket.id].y -= 1;
            }
          }
        } else if (data === 'down') {
          if (y < 4) {
            if (actualBattles[actualBattles[socket.id].opponent].y !== y + 1 ||
                actualBattles[actualBattles[socket.id].opponent].x !== x) {
              actualBattles[socket.id].y += 1;
            }
          }
        }
        var playerCords = { // WHO WAS MOVE, AND CORDS
            'stat' : actualBattles[socket.id].stat,
            'x' : actualBattles[socket.id].x,
            'y' : actualBattles[socket.id].y
          };
        socket.emit('on-move', playerCords);
        io.sockets.socket(actualBattles[socket.id].opponent).emit('on-move', playerCords);
      }
    });
    /* LOGIC OF POTIONS */
    socket.on('potion', function (data) {
      if (data === 'str') {
        actualBattles[socket.id].str += 10;
        actualBattles[socket.id].att += 15;
        Stalker.update({'nick' : socketToStalker[socket.id]},
          { $inc: { energetic: -1 }}, function () {});
      } else if (data === 'acc') {
        actualBattles[socket.id].acc += 10;
        actualBattles[socket.id].head += 10;
        Stalker.update({'nick' : socketToStalker[socket.id]},
          { $inc: { vodka: -1 }}, function () {});
      } else {
        actualBattles[socket.id].life += 50;
        if (actualBattles[socket.id].life >= actualBattles[socket.id].end * 20) {
          actualBattles[socket.id].life = actualBattles[socket.id].end * 20;
        }
        Stalker.update({'nick' : socketToStalker[socket.id]},
          { $inc: { first: -1 }}, function () {});
        socket.emit('potion-result', {'who' : actualBattles[socket.id].stat,
                                      'life' : actualBattles[socket.id].life});
        io.sockets.socket(actualBattles[socket.id].opponent).emit('potion-result', {
          'who' : actualBattles[socket.id].stat,
          'life' : actualBattles[socket.id].life
        });
      }
    });
    socket.on('skill', function (data) {
      actualBattles[socket.id].skill = data;
    });
    
    /* SHOOTING, IF HIT SEND SPECIFIC DATA WITH CALCULATED DMG AND UPDATED LIFE, IF MISS SEND EVENT WITH INFO */
    socket.on('shooting', function (data) {
      if (actualBattles[socket.id]) {
        var opponent_socket = actualBattles[socket.id].opponent,
        calculateDmg = function (dmg, crit) {
          var dmg_dispersion = 1 - (Math.floor((Math.random() * 100) % 41 - 20) / 100).toPrecision(2),
            crit_chance = Math.floor(Math.random() * 1000) % 101;
          dmg = dmg * dmg_dispersion;
          if (crit_chance < crit) {
            dmg = dmg * 2;
          }
          return dmg.toPrecision(3);
        },
        skillBarrage = function (x,y) {
          var i,
              j,
              shooting_stats = {},
              hit = [];
          for (i = y - 1; i < y + 2; i += 1) {
            for (j = x - 1; j < x + 2; j += 1) {
              if (actualBattles[opponent_socket].x === j && actualBattles[opponent_socket].y === i) {
                hit.push(j);
                hit.push(i);
              }
            }
          }
          if (hit.length > 0) {
            if (actualBattles[socket.id].stat === 'attacker') {
              shooting_stats.attacker = actualBattles[socket.id].life;
              shooting_stats.defender = actualBattles[opponent_socket].life;
              shooting_stats.x = x;
              shooting_stats.y = y;
              shooting_stats.skill = true;
            } else {
              shooting_stats.defender = actualBattles[socket.id].life;
              shooting_stats.attacker = actualBattles[opponent_socket].life;
              shooting_stats.x = x;
              shooting_stats.y = y;
              shooting_stats.skill = true;
            }
          } else {
            shooting_stats.x = x;
            shooting_stats.y = y;
            shooting_stats.miss = true;
            shooting_stats.skill = true;
          }
          return shooting_stats;
        };          
        var shoot_dmg = calculateDmg(actualBattles[socket.id].att, actualBattles[socket.id].head);
        if (actualBattles[socket.id].skill !== '') {
          if (actualBattles[socket.id].skill === 'barrage') {
            var after_barrage = skillBarrage(data.x, data.y);
            actualBattles[socket.id].skill = '';
            
            if (after_barrage.miss) {
              socket.emit('shooting-result', after_barrage);
              io.sockets.socket(opponent_socket).emit('shooting-result', after_barrage);
            } else {
              actualBattles[opponent_socket].life = Math.floor(actualBattles[opponent_socket].life - shoot_dmg);
              if (actualBattles[socket.id].stat === 'attacker') {
                after_barrage.defender = actualBattles[actualBattles[socket.id].opponent].life;
              } else {
                after_barrage.attacker = actualBattles[actualBattles[socket.id].opponent].life;
              }
              socket.emit('shooting-result', after_barrage);
              io.sockets.socket(opponent_socket).emit('shooting-result', after_barrage);
              if (actualBattles[opponent_socket].life <= 0) {
                fightStatus(socket.id);
              }
            }
          }
        } else {
          if (actualBattles[opponent_socket].x === data.x && actualBattles[opponent_socket].y === data.y) {
            actualBattles[opponent_socket].life = Math.floor(actualBattles[opponent_socket].life - shoot_dmg);
            var shooting_stats = {};
            if (actualBattles[socket.id].stat === 'attacker') {
              shooting_stats.attacker = actualBattles[socket.id].life;
              shooting_stats.defender = actualBattles[opponent_socket].life;
              shooting_stats.who = 'defender';
            } else {
              shooting_stats.defender = actualBattles[socket.id].life;
              shooting_stats.attacker = actualBattles[opponent_socket].life;
              shooting_stats.who = 'attacker';
            }
            socket.emit('shooting-result', shooting_stats);
            io.sockets.socket(opponent_socket).emit('shooting-result', shooting_stats);
            if (actualBattles[opponent_socket].life <= 0) {
              fightStatus(socket.id);
            }
          } else {
            socket.emit('shooting-result', {miss: true, x: data.x, y: data.y});
            io.sockets.socket(opponent_socket).emit('shooting-result', {miss: true, x: data.x, y: data.y});
          }
        }
      }
    });
    /* TRAVELING */
    socket.on('travel', function (data) {
      Stalker.update({'nick' : socketToStalker[socket.id]},
          { $set: { place: data.where }}, function () {});
      placeMe(data.where);
    });
    /* LEVEL UP, INCREASE STATISTICS */
    socket.on('level-up', function (data) {
      Stalker.findOne({'nick' : socketToStalker[socket.id]}, function (err, stalkers) {
        if (stalkers.points > 0) {
          var upd = {};
          if (data === 'str') {
            upd = {points: -1, str: 1};
          } else if (data === 'acc') {
            upd = {points: -1, acc: 1};
          } else {
            upd = {points: -1, end: 1, life: 20};
          }
          Stalker.update({'nick' : socketToStalker[socket.id]},
            { $inc:  upd }, function () {
              socket.emit('level-up-result', 1);
            });
        } else {
          socket.emit('level-up-result', 0);
        }
      });
    });
    /* SHOOPING - INCREASE ITEMS STAT */
    socket.on('shooping', function (data) {
      var upd;
      Stalker.findOne({ 'nick' : socketToStalker[socket.id]}, function (err, stalkers) {
        if (data === 'weapon' || data === 'armor' || data === 'scope') {
          if (stalkers.money >= 500) {
            if (data === 'weapon') {
              upd = { money: -500, weapon: 1, str: 1};
            } else if (data === 'scope') {
              upd = { money: -500, scope: 1, acc: 1};
            } else {
              upd = { money: -500, armor: 1, end: 1, life: 20};
            }
            Stalker.update({'nick' : socketToStalker[socket.id]},
              { $inc: upd }, function () {});
            socket.emit('shopping-result', 1);
          } else {
            socket.emit('shopping-result', 0);
          }
        } else {
          if (stalkers.money >= 50) {
            if (data === 'energetic') {
              upd = { money: -50, energetic: 1 };
            } else if (data === 'vodka') {
              upd = { money: -50, vodka: 1 };
            } else {
              upd = { money: -50, firstaid: 1 };
            }
            Stalker.update({'nick' : socketToStalker[socket.id]},
              { $inc: upd }, function () {});
            socket.emit('shopping-result', 1);
          } else {
            socket.emit('shopping-result', 0);
          }
        }
      });
    });
    socket.on('msg', function (data) {
      io.sockets.to(stalkerLocation[socket.id]).emit('msg', socketToStalker[socket.id] + ': ' + data);
    });
    socket.on('disconnect', function () { // IF WAS IN FIGHT, OPPONENT WIN WITH WALKOVER
      if (actualBattles[socket.id]) {
        fightStatus(socket.id, 'walkover');
      }
      delete stalkerToSocket[socketToStalker[socket.id]];
      delete socketToStalker[socket.id];
      var oldRoom = stalkerLocation[socket.id];
      delete stalkerLocation[socket.id];
      delete stalkerFactions[socket.id];
      socket.broadcast.to(oldRoom).emit('players-list', playersList(oldRoom));
    });
  });
};

/* RETURNS ACCOUNT LOGIN */
exports.socketConnect = function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf8'
  });
  res.end(JSON.stringify(req.session.account));
};

/* MAIN PAGE */
exports.index = function (req, res) {
  var pageHtml = '',
    statistics = '';
  if (!req.session.account) {
    pageHtml = '<div id="index"><p class="bold-center">Stalker Wars</p>' +
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
  }
  res.render('index', {
    gaming : pageHtml
  });
};

/* LOGIN FORM */
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
        // ADD USER INTO ALLOWED SOCKETS
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
    }
  });
};

/* LOGOUT */
exports.logout = function (req, res) {
  if (req.session.account) {
    var x;
    for (x in usersAllowed) {
      if (usersAllowed[x] === req.session.account) {
        delete usersAllowed[x];
      }
    }
    req.session.account = null;
  }
  res.clearCookie('connect.sid');
  res.redirect('/');
};

/* CREATE STALKER FORM */
exports.createChar = function (req, res) {
  var img = '',
    i,
    pageHtml;
  for (i = 0; i < 6; i += 1) {
    img += "<img src=\"../images\\avatar_" + i + ".jpg\" class=\"avatars\"/>";
  }
  if (!req.session.account) {
    pageHtml = '<div id="create-character"><form id="crt-char-form" action="/create-stalker" method="post"' +
      'accept-charset="utf-8">' +
      '<table>' +
      '<tr><td></td><td></td><td rowspan=7><input type="hidden" name="avatar"/>' +
        '<img id="avatar" src="../images/avatar_none.jpg"/><br/><img id="faction" ' +        'src="../images/avatar_none.jpg"/></td></tr>' +
        '<tr><td><span>Imie: </span></td><td><input type="text" name="nickname" class="text_input"/></td></tr>' +
        '<tr><td><span>Hasło: </span></td><td><input type="password" name="password"' +
        'class="text_input"/></td></tr><tr><td><span>Frakcja: </span></td><td>' +
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
  }
};

/* GET CHARACTER SCHEMA FOR CHOOSE FACTION */
exports.getCharacterSchema = function (req, res) {
  StalkerSchema.findOne({ 'name' : req.query.faction }, function (err, stalkerschemas) {
    var schema = { 'image' : stalkerschemas.image,
      'str' : stalkerschemas.str, 'acc' : stalkerschemas.acc,
      'end' : stalkerschemas.end, 'points' : stalkerschemas.points
      };
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf8'
    });
    res.end(JSON.stringify(schema));
  });
};

/* CREATE STALKER */
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
    vodka         : 0,
    firstaid      : 0
  }).setPassword(req.body.password)
    .save(function (err, count) {
      if (err) {
        if (err.code === 11000) {
          res.render('index', {
            gaming : 'Istnieje już postać o takim nicku'
          });
        }
      } else {
        res.redirect('/');
      }
    });
};
/* GENERATE AND SEND STATISTICS FOR PLAYER */
exports.statistics = function (req, res) {
  if (req.session.account) {
    Stalker.findOne({'nick' : req.session.account}, function (err, stalkers) {
      var statHTML = '';
      if (stalkers) {
        var statistics = {
          avatar  : stalkers.avatar,
          faction : stalkers.faction,
          nick    : stalkers.nick,
          level   : stalkers.level,
          points  : stalkers.points,
          dmg     : parseInt(stalkers.str, 10) * 1.5,
          head    : parseInt(stalkers.acc, 10),
          life    : stalkers.life,
          str     : stalkers.str,
          acc     : stalkers.acc,
          end     : stalkers.end,
          money   : stalkers.money,
          place   : stalkers.place,
          weapon  : stalkers.weapon,
          armor   : stalkers.armor,
          scope   : stalkers.scope,
          energetic : stalkers.energetic,
          vodka   : stalkers.vodka,
          firstaid: stalkers.firstaid
        };
      }
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf8'
      });
      res.end(JSON.stringify(statistics));
    });
  } else {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf8'
    });
    res.end(JSON.stringify('Najpierw musisz się zalogować'));
  }
};
