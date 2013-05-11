$(document).ready(function () {
'use strict';
	// Socket connection establish
	var socket = io.connect('http://localhost:3000');
	$.post("socket-connect", function(data) {
		if (data) {
			socket.emit('connectMe', data);
		}; 
	});
	// Receive messages on shoutbox
	socket.on('msg', function(data){
		shoutboxCatchMsg(data);
	});
	
	// Sending messages in shoutbox
	shoutboxInterface(function (shoutboxInput){
		socket.emit('msg', shoutboxInput);
	});
	// Async page viewer
	pageManager();
	
	
	
	
});
  
  
  
  
  
  
  
   


