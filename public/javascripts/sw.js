var socket = io.connect('http://localhost:3000');
$(document).ready(function () {
	// Socket connection establish
	$.post("socket-connect", function(data) {
		if (data) {
			socket.emit('connectMe', data);
		}; 
	});
	// Receive messages on shoutbox
	socket.on('msg', function(data) {
		shoutboxCatchMsg(data);
	});

	// Shoutbox on
	shoutboxInterface();

	// Async page viewer
	pageManager();
	
	socket.on('wantYouFight', function(data) {
		attackOrRun(data);
	});
	
	
});
  
  
  
  
   


