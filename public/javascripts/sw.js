'use strict';
$(document).ready(function () {
  var socket = io.connect('http://localhost:3000');
  socket.on('error', function (reason){
    console.error('Unable to connect Socket.IO', reason);
    createCharScripts();
  });
  
  socket.on('connect', function (){
    console.info('Nawiązano połączenie');
    $.post("socket-connect", function(data) {
      socket.emit('connectMe', data);
      getStatistics(socket);
      myInterface();
    });
  });
  
  socket.on('server-event', function(data) {
    
    $('#gaming').css('background-image', 'url(' + data.bg + ')');
    
    console.log(data.name);
    console.log(data.info);
    console.log(data.time);
    console.log(data.speed);
    console.log(data.reward);
    console.log(data.rewardText);
    console.log(data.penalty);
    console.log(data.penaltyText);
    fsMsg(data.name, 5000);
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
