$(document).ready(function () {
  'use strict';
  var socket = io.connect('http://localhost:3000');
  socket.on('error', function (reason) {
    console.error('Unable to connect Socket.IO', reason);
    createCharScripts();
  });
  socket.on('connect', function () {
    console.info('Nawiązano połączenie');
    $.post("socket-connect", function(data) {
      socket.emit('connectMe', data);
      getStatistics(socket);
      myInterface();
    });
  });
  
  
  
  socket.on('server-event', function(data) {
    $('#gaming').css('background', 'url(../images/grass.jpg)');
    var generateMap = function () {
      var giveRand = function (tab) {
        if (!tab) {
          return Math.floor((Math.random() * 100)) % 12;
        } else {
          var cords = [],
              randCount = ((Math.floor(Math.random() * 100)) % 25) + 5;
          for( var i = 0; i < randCount; i += 1) {
            cords.push((Math.floor((Math.random() * 100)) % 4) + 1);
            cords.push(Math.floor((Math.random() * 100)) % 12);
            tab.push(cords);
            cords = [];
          };
        };
      };
      
      var idUnparse = function (div) {
        var id = div.attr('id');        
        
        id = id.slice(6);
        id = id.split('-');
      
        return {
          x : parseInt(id[0], 10),
          y : parseInt(id[1], 10)
        };
      };
      
      var playerColumn = giveRand(),
          bunkerColumn = giveRand(),
          monsterPositions = [],
          cratesPositions = [],
          eventMap = [],
          tempMap = [],
          killCounter = 0;
          giveRand(monsterPositions);
          giveRand(cratesPositions);
      
      for (var i = 0; i < 6; i += 1) {
        for (var j = 0; j < 12; j += 1) {
          tempMap.push(0);
        };
        eventMap[i] = tempMap;
        tempMap = [];
      };
      
      // PLAYER PLACE
      $('#gaming').append('<canvas width="517" height="267" id="eventCanvas"></canvas>')
                  .css('cursor', 'url(../images/cross1.cur), auto');

      var playerDiv = '<div class="player" id="player' + playerColumn + "-" + 5 + 
                      '" tabindex="-1" style="z-index: 1;display: inline-block;width: 40px; height: 40px; position: absolute;' +
                      'left: ' + playerColumn * 42 + 'px; top: ' + 5 * 42 + 'px"><img class="playerImg"' + 
                      'src="../images/eventModelR.png" style="position: relative; bottom: 50px"></img></div>';
      $('#gaming').append(playerDiv);
      $('#gaming').append('<span class="counter" style="position: absolute; bottom: 0px; right: 0px"></span>');
      $('.counter').text(killCounter);
      
      
      $('.player').focus();
      eventMap[5][playerColumn] =  1;
      
      // BUNKER PLACE
      var bunkerDiv = '<div class="bunker" style="z-index: 0; display: inline-block; width: 40px; height: 40px; ' +
                      'position: absolute; left: ' + (bunkerColumn * 42) + 'px; top: 0px"><img class="bunkerImg"' + 
                      'src="../images/bunker.png" style="position: relative;"></img></div>';
      $('#gaming').append(bunkerDiv);
      
      // MONSTER PLACE
      
      var monstersDiv = '';
      for (var i = 0; i < monsterPositions.length; i += 1) {
        
        if ( eventMap[monsterPositions[i][0]][monsterPositions[i][1]] !== -1 ) {
          var snorkType = Math.random() > 0.5 ? '1' : '';
          monstersDiv += '<div id="monstr' + monsterPositions[i][1] + '-' + monsterPositions[i][0] + '" class="monsters"' +
                         'style="background-repeat:no-repeat;z-index: 0; display: inline-block; width: 40px; height: 40px; ' +
                         'position: absolute; left: ' + monsterPositions[i][1] * 42 + 'px; top: ' + monsterPositions[i][0] * 42 +
                         'px; background-image: url(../images/snork' + snorkType + '.png)"></div>';
          eventMap[monsterPositions[i][0]][monsterPositions[i][1]] = -1;
        };
      };
      
      $('#gaming').append(monstersDiv);
      
      // PLAYER MOVING
      var stalkerWalking = function (e) {
        $('#gaming').unbind('keydown');
        
        setTimeout( function () {
          $('#gaming').keydown( function (e) {
          stalkerWalking(e);
          });
        }, 250);
        
        switch(e.which) {
          case 37: { // LEFT
            if (idUnparse($('.player')).x > 0) {
              var pos = idUnparse($('.player')),
                  x = pos.x,
                  y = pos.y;
              if (eventMap[y][x - 1] !== -1) {
                $('.playerImg').attr('src', '../images/eventModelL.png');
                eventMap[y][x] = 0;
                x -= 1;
                eventMap[y][x] = 1;
                $('.player').attr('id', 'player' + x + '-' + y).animate({"left": "-=42px"}, 250);
              };
            };
            break;
          };
          case 38: { // UP
            if (idUnparse($('.player')).y > 0) {
              var pos = idUnparse($('.player')),
                  x = pos.x,
                  y = pos.y;
              if (eventMap[y - 1][x] !== -1) {
                eventMap[y][x] = 0;
                y -= 1;
                eventMap[y][x] = 1;
                $('.player').attr('id', 'player' + x + '-' + y).animate({"top": "-=42px"}, 250);
              };
            };
            break;
          };
          case 39: { // RIGHT
            if (idUnparse($('.player')).x < 11) {
              var pos = idUnparse($('.player')),
                  x = pos.x,
                  y = pos.y;
              if (eventMap[y][x + 1] !== -1) { 
                $('.playerImg').attr('src', '../images/eventModelR.png');
                eventMap[y][x] = 0;
                x += 1;
                eventMap[y][x] = 1;
                $('.player').attr('id', 'player' + x + '-' + y).animate({"left": "+=42px"}, 250);
              };
            };
            break;
          };
          case 40: { // DOWN
            if (idUnparse($('.player')).y < 5) {
             var pos = idUnparse($('.player')),
                  x = pos.x,
                  y = pos.y;
              if (eventMap[y + 1][x] !== -1) {
                eventMap[y][x] = 0;
                y += 1;
                eventMap[y][x] = 1;
                $('.player').attr('id', 'player' + x + '-' + y).animate({"top": "+=42px"}, 250);
              };
            };
            break;
          };
          default: return;
        };
        e.preventDefault();
        var cords = idUnparse($('.player'));
        if (cords.x === bunkerColumn && cords.y === 0) {
          // SURVIVED
          socket.emit('rescue', killCounter);
          bunkerColumn = -1;
          $('#gaming').unbind('keydown');
          $('.monsters').unbind('click');
        };
      };
      
      $('#gaming').keydown(function (e){
        stalkerWalking(e)
      });
      
      // MONSTER KILLING
      var monsterShooting = function (monster) {
        var gunSound = new Audio("../sounds/gun1.wav");
        gunSound.play();
        
        // UNBIND EVENT
        $('.monsters').unbind('click');
        $('#gaming').css('cursor', 'crosshair');
        // BIND EVENT AGAIN AFTER (PREVENT SPAM SHOOTING)
        setTimeout( function () {
          $('#gaming').css('cursor', 'url(../images/cross1.cur),auto');
          $('.monsters').click( function () {
            monsterShooting($(this));
          });
        }, 750);
        
        // ACTIONS OF SINGLE EVENT
        var deadSound = (Math.random() > 0.5) ? new Audio("../sounds/snork1.wav") : new Audio("../sounds/snork2.wav");
        deadSound.play();
        $('#eventCanvas').fadeIn(0);
        var cords = divCenters($('.player')); // PLAYER CORDS
        drawLines(cords.concat(divCenters(monster)), 'eventCanvas'); // DRAW LINES BETWEEN PLAYER AND DIV
        $('#eventCanvas').fadeOut(400);
        
        monster.css('background-image', 'url(../images/blood.png)'); // SMASH MONSTER!
        
        var cords = idUnparse(monster);
        eventMap[cords.y][cords.x] = 0;
        
        killCounter += 1;
        $('.counter').text(killCounter);
        
        setTimeout(function () {
          monster.remove(); // REMOVE, AFTER BLOOD MASSACRE
          $('.player').focus();
        }, 300);
        
      };
      
      $('.monsters').click(function () {
        monsterShooting($(this));
      });
      
    }();
   
    fsMsg(data, 5000);
    
  });
  
  socket.on('event-statistics', function (data) {
    $('#gaming').empty();
    getStatistics(socket);
    
    if (data.stat === 1) {
      var cashSound = new Audio("../sounds/cash.wav");
          cashSound.play();
    }
    
    
    myPopup(data.msg);
  });
  
  socket.on('wantYouFight', function(data) {
    attackOrRun(data);
  });
  
  // SHOW PLAYERS LIST
  socket.on('players-list', function (data) {
    showPlayers(data, socket);
  });
  
  // SHOW RECEIVED MESSAGES
  socket.on('msg', function(data) {
    shoutboxCatchMsg(data);
  });

  // TURN ON SHOUTBOX INTERFACE
  shoutboxInterface(socket);

});
