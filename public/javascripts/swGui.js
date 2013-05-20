/* Popup window generator */
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

/* Write msg received on shoutbox */
var shoutboxCatchMsg = function (data) {
	$('#shoutbox div')
		.append('<p>' + data + '</p>')
		.animate({scrollTop: $('#shoutbox div').prop("scrollHeight")}, 0);
	$('#shoutbox span').css('display', 'none').fadeIn(500);
};

/* Interface for shoutbox, and send msg operation */
var shoutboxInterface = function() {
	$('#shoutbox input').keyup(function(e){
		if (e.keyCode === 13 && $(this).val() !== ''){
			var shoutboxInput = $(this).val();
			socket.emit('msg', shoutboxInput);
			$(this).val('');
		};
	}).focus();
};

var getStatistics = function () {
	$.getJSON("/statistics", function(data) {
		$('#statistics').html(data);
	});
};

var showPlayers = function (data) {
	var players = '<table>';
	for (var i = 0; i < data.length; i += 1) {
		if (i % 3 === 0 && i > 0) players += '<tr>';
		players += '<td><p><img name="att" src="../images/attack_icon.png" class="op-icons" /><span>' + data[i] + 
		'</span></p></td>';
		if (i % 3 === 0 && i > 0) players += '</tr>';
	};
	players += '</table>';
	$('#players').html(players);
	runBattleScripts();
};

var loadMap = function () {
	var cord = '<map name="map-map">' +
			     '<area shape="rect" coords="1, 1, 50, 50" name="tst" />' +
				 '<area shape="rect" coords="100,100,150,150" name="qwe"/>' +
			   '</map>'
	$('#map').html('<img src="../images/mapa.jpg" usemap="#map-map"/>').append(cord);
	
	$('area').click(function (){
	  alert($(this).attr('name'));
	});
	
};

