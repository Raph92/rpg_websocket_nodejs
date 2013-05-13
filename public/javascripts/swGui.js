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
var shoutboxInterface = function(action) {
	$('#shout_open').click(function () {
		if ($('#shoutbox').css('visibility') === 'hidden') {
			$('#shoutbox').css('visibility', 'visible');
			$('#shoutbox input').keyup(function(e){
				if (e.keyCode === 13 && $(this).val() !== ''){
					var shoutboxInput = $(this).val();
					action(shoutboxInput); // Callback
					$(this).val('');
				};
			}).focus();
		} else {
			$('#shoutbox').css({'visibility': 'hidden'});
		};
	});
};

/* Request for server resources, and show it as page */
var pageManager = function() {
	$('#navbar a').click(function (){
		var page = $(this).attr('name');
		if (page !== '/') {
			$.getJSON(page, function (data){
				$('#game').html(data);
				
				// Script sets for pages
				if (page === '/create-character') {
					createCharScripts();
				};
				
			});
		} else {
			document.location.href='/';
		};
	});
};



