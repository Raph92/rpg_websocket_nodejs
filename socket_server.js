var socketio = require('socket.io'),
    guestNumber = 0;

exports.listen = function(server) {
    var io = socketio.listen(server);
    io.set('log level', 1);
	io.sockets.on('connection', function (socket) {
    
	});
};
