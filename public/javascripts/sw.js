$(document).ready(function () {
  'use strict';
  /* RUN SCRIPTS TO IMPROVE REGISTRATION FORM */
  createCharScripts();
  var socket = io.connect(window.location.hostname);
  socket.on('error', function (reason) {
    console.error('Unable to connect Socket.IO', reason);
  });
  socket.on('connect', function () {
    console.info('Nawiązano połączenie');
    /* SPECIFIC POST ROUTE, TO JOIN PLAYER LOGIN, WITH SOCKET.ID */
    $.post("socket-connect", function (data) {
      socket.emit('connectMe', data);
      getStatistics(socket);
      myInterface();
      runBattleScripts(socket);
    });
  });
  /* SHOOPING RESULTS */
  socket.on('shopping-result', function (data) {
    if (data === 1) {
      getStatistics(socket, false);
      var buySound = new Audio("../sounds/buy.wav");
      buySound.play();
    } else {
      myPopup('Nie stać Cię na zakup', 0, 100, 200);
    }
  });
  /* LEVEL UP RESULTS */
  socket.on('level-up-result', function (data) {
    if (data === 1) {
      getStatistics(socket, false);
      var lvlSound = new Audio("../sounds/lvl.wav");
      lvlSound.play();
    } else {
      myPopup('Nie masz wolnych punktów umiejętności', 0, 120, 200);
    }
  });
  /* CLIENT RECEIVE THIS, WHEN OTHER PLAYER ATTACK, THIS IS SIMPLE INFORMATION */
  socket.on('battle', function (data) {
    fightInfo(data);
  });
  /* ... BUT THIS IS FUNCTION TO LOAD BATTLE ARENA */
  socket.on('map-load', function (data) {
    $('#gaming').unbind('keydown');
    generateMap(data, socket);
  });
  /* RECEIVED WHEN BATTLE IS OVER */
  socket.on('fight-result', function (data) {
    if (data.stat === 1) {
      var cashSound = new Audio("../sounds/cash.wav");
      cashSound.play();
    }
    $('#gaming').unbind('keydown');
    $('.battleDivs').unbind('click');
    $('#gaming').empty();
    getStatistics(socket);
    myPopup(data.msg, 0, 200, 300);
    runBattleScripts(socket);
  });
  /* CLIENT TRY TO SHOOT OPPONENT, IF HIT, RECEIVE THIS EVENT */
  socket.on('shooting-result', function (data) { 
    if(data.skill) {
      var barrageSound = new Audio("../sounds/barrage.wav"),
        i,
        j;
      var animateBarrage = function (x, y) {
        var temp = [];
        for (i = y - 1; i < y + 2; i += 1) {
          for (j = x - 1; j < x + 2; j += 1) {
            $('#place' + j + '-' + i).css('background-image', 'url(../images/bullet_whole.png)');
          }
        }
        setTimeout(function () {
        for (i = y - 1; i < y + 2; i += 1) {
          for (j = x - 1; j < x + 2; j += 1) {
            $('#place' + j + '-' + i).css('background-image', 'none');
          }
        }  
        }, 1000);
      };  
      if (!data.miss) {
        console.log(data);
        $('.hp-count:eq(0)').text(data.attacker + 'HP');
        $('.hp-count:eq(1)').text(data.defender + 'HP');
        animateBarrage(data.x, data.y);
        barrageSound.play();
      } else {
        animateBarrage(data.x, data.y);
        barrageSound.play();
      }
    } else {
      var gunSound = new Audio("../sounds/ak.wav");
      if (!data.miss) {
        gunSound.play();
        $('.hp-count:eq(0)').text(data.attacker + 'HP');
        $('.hp-count:eq(1)').text(data.defender + 'HP');
        $('#' + data.who).parent().append('<img style="position:relative; bottom: 140px;"' +                                  'id="last-bloody" src="../images/blood.png"></img>');
        setTimeout(function () {
          $('#last-bloody').remove();
        }, 500);
      } else {
        gunSound.play();
        $('#place' + data.x + '-' + data.y).css('background-image', 'url(../images/bullet_whole.png)');
        setTimeout(function () {
          $('#place' + data.x + '-' + data.y).css('background-image', 'none');
        }, 500);
      }
    }
    
    
    
    
    
  });
  /* RECEIVED WHEN PLAYERS MOVES, CHANGE POSITION OF RIGHT DIV */
  socket.on('on-move', function (data) {
    var model = '';
    if (data.stat === 'attacker') {
      model = $('#attacker').attr('src');
      $('#attacker').remove();
      $('#place' + data.x + '-' + data.y).append('<img tabindex="-1" id="attacker" src="'
        + model + '" style="position:relative; bottom: 65px"></img>');
      $('#attacker').focus();
    }
    if (data.stat === 'defender') {
      model = $('#defender').attr('src');
      $('#defender').remove();
      $('#place' + data.x + '-' + data.y).append('<img tabindex="-1" id="defender" src="'
        + model + '" style="position:relative; bottom: 65px"></img>');
      $('#defender').focus();
    }
  });
  /* INFORMATION ABOUT OPPONENT IS NOT AVAILABLE FOR BATTLE (OTHER BATTLE, OR EVENT) */
  socket.on('opponent-in-battle', function (data) {
    myPopup(data, 0, 200, 300);
  });
  /* RECEIVED WHEN SERVER EVENT INCOMING, LOAD MAP WITH MONSTERS */
  socket.on('server-event', function (data) {
    generateEventMap(data, socket);
  });
  /* RECEIVED WHEN EVENT END, (RETURNS RESULT, POSITIVE OR NEGATIVE) */
  socket.on('event-statistics', function (data) {
    $('#gaming').unbind('keydown');
    $('#gaming').empty();
    getStatistics(socket);
    if (data.stat === 1) {
      var cashSound = new Audio("../sounds/cash.wav");
      cashSound.play();
    }
    myPopup(data.msg, 0);
    runBattleScripts(socket);
  });

  /* SHOW PLAYERS LIST */
  socket.on('players-list', function (data) {
    showPlayers(data, socket);
  });

  /* SHOW RECEIVED MESSAGES */
  socket.on('msg', function (data) {
    shoutboxCatchMsg(data);
  });

  /* TURN ON SHOUTBOX INTERFACE */
  shoutboxInterface(socket);
});
