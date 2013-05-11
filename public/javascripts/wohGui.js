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
	$('#shoutbox span').click(function () {
		if ($(this).parent().css('height') === '18px') {
			$(this).parent()
			.css({'height': '200px', 'width': '200px'})
			.append('<input type="text"></input>');

			$('#shoutbox div').css({'visibility': 'visible', 'height' : '175px'});
			
			$('#shoutbox input').keyup(function(e){
				if (e.keyCode === 13 && $(this).val() !== ''){
					var shoutboxInput = $(this).val();
					action(shoutboxInput);
					$(this).val('');
				};
			}).focus();
		} else {
			$(this).parent().css({'height': '18px', 'width': '26px'});
			$('#shoutbox input').remove();
			$('#shoutbox div').css({'visibility': 'hidden', 'height': '0px'});
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

/* Events added for generate interactive create character form */
var createCharScripts = function () {
	$('#avatar').click(function (){
		$('#avatars_choose').fadeIn(200);
		$('.avatars').click(function () {
			var clicked_img = $(this).attr("src");
			$('#avatar').attr('src', clicked_img);
		});
		$('#close_popup').click(function (){
			$('#avatars_choose').fadeOut(200);
		});		
	});
};

