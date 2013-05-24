var runBattleScripts = function (socket) {
  
// OBJECT FOR RECEIVING CHARACTER TO BATTLE
var myStalker = {
  place : ''
};




	$('img[name="att"]').click(function (){
		var opponent = $(this).next().text();
		socket.emit('fightWithMe', opponent);
	});

	
	
	
	
};

var attackOrRun = function (data) {
	
	
	
	
	
	var myPopup = function (text, height, width, delay) {		
	if ($('body').find('#myPopup').html() !== undefined) {
		$('#myPopup').remove();	
	};				
	$('body').append('<div id="myPopup" style="display : none;">' 
	+ text + '<img id="close_popup" src="../images/close.png"></img></div>');		
	
	$('#myPopup').css({	'height': height + 'px', 'width': width + 'px' });		
	$('#myPopup #close_popup').click(function () {
		$('#myPopup').remove();			
	});		
	$('#myPopup').fadeIn(delay);	
};
	
	myPopup('Gracz ' + data.who + ' atakuje!<button/>', 100, 300, 300);
	
	
	
};

