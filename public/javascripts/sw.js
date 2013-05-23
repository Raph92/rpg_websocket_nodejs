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
      
    });
  });
  
  // Receive messages on shoutbox
  socket.on('msg', function(data) {
    shoutboxCatchMsg(data);
  });

  // Shoutbox on
  shoutboxInterface(socket);

  socket.on('wantYouFight', function(data) {
    attackOrRun(data);
  });
  
  socket.on('players-list', function (data) {
    showPlayers(data, socket);
  });
  
});

var myStalker = {
  place : ''
};
  
  
  
  
   


