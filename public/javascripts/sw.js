$(document).ready(function () {
  'use strict';
  createCharScripts();
  var socket = io.connect('http://localhost:3000');
  socket.on('error', function (reason) {
    console.error('Unable to connect Socket.IO', reason);
  });
  socket.on('connect', function () {
    console.info('Nawiązano połączenie');
    $.post("socket-connect", function (data) {
      socket.emit('connectMe', data);
      getStatistics(socket);
      myInterface();
      runBattleScripts(socket);
    });
  });
  socket.on('shopping-result', function (data) {
    if (data === 1) {
      getStatistics(socket, false);
      var buySound = new Audio("../sounds/buy.wav");
      buySound.play();
    } else {
      myPopup('Nie stać Cię na zakup', 0, 100, 200);
    }
  });
  socket.on('level-up-result', function (data) {
    if (data === 1) {
      getStatistics(socket, false);
      var lvlSound = new Audio("../sounds/lvl.wav");
      lvlSound.play();
    } else {
      myPopup('Nie masz wolnych punktów umiejętności', 0, 120, 200);
    }
  });
  socket.on('battle', function (data) {
    fightInfo(data);
  });
  socket.on('map-load', function (data) {
    generateMap(data, socket);
  });
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
  socket.on('shooting-result', function (data) {
    $('.hp-count:eq(0)').text(data.attacker + 'HP');
    $('.hp-count:eq(1)').text(data.defender + 'HP');
    $('#' + data.who).parent().append('<img style="position:relative; bottom: 140px;"' +                                  'id="last-bloody" src="../images/blood.png"></img>');
    setTimeout(function () {
      $('#last-bloody').remove();
    }, 500);
  });
  socket.on('opponent-in-battle', function (data) {
    myPopup(data, 0, 200, 300);
  });
  socket.on('server-event', function (data) {
    generateEventMap(data, socket);
  });
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

  // SHOW PLAYERS LIST
  socket.on('players-list', function (data) {
    showPlayers(data, socket);
  });

  // SHOW RECEIVED MESSAGES
  socket.on('msg', function (data) {
    shoutboxCatchMsg(data);
  });

  // TURN ON SHOUTBOX INTERFACE
  shoutboxInterface(socket);

});
