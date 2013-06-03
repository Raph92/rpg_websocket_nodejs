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
      createCharScripts();
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
    };
  });
  
  socket.on('battle', function(data) {
    fightInfo(data);
  });
  
  socket.on('map-load', function (data) {
    generateMap(data, socket);
  });
  
  socket.on('fight-result', function (data) {
    if (data.stat === 1) {
      var cashSound = new Audio("../sounds/cash.wav");
          cashSound.play();
    };
    $('#gaming').empty();
    getStatistics(socket);
    myPopup(data.msg, 0, 200, 300);
  
  });
  
  socket.on('opponent-in-battle', function (data) {
    myPopup(data, 0, 200, 300);
  });
  
  socket.on('server-event', function(data) {
    generateEventMap(data, socket);
  });
  
  socket.on('event-statistics', function (data) {
    $('#gaming').empty();
    getStatistics(socket);
    
    if (data.stat === 1) {
      var cashSound = new Audio("../sounds/cash.wav");
          cashSound.play();
    };
    
    myPopup(data.msg, 0);
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
