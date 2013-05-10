$(document).ready(function () {
'use strict';

var socket = io.connect('http://localhost:3000');
$.post("socket-connect", function(data) {
	if (data) {
		socket.emit('connectMe', data);
		// operacje na socket
	}; 
});



socket.on('msg', function (data) { 
	$('#shoutbox div').append('<p>' + data + '</p>');
	$('#shoutbox span').css('display', 'none').fadeIn(500);
	$('#shoutbox div').animate({scrollTop: $('#shoutbox div').prop("scrollHeight")}, 0);
});



$('#navbar a').click(function (){
	if ($(this).attr('name') !== '/') {
		$.getJSON($(this).attr('name'), function (data){
			$('#game').html(data);
		});
	} else {
		document.location.href='/';
	};
});

// SHOUTBOX
$('#shoutbox span').click(function () {
	if ($(this).parent().css('height') === '18px') {
		$(this).parent().css({'height': '200px', 'width': '200px'});
		$(this).parent().append('<input type="text"></input>');
		
		$('#shoutbox input').keyup(function(e){
			if (e.keyCode === 13 && $(this).val() !== ''){
				socket.emit('msg', $('#shoutbox input').val());
				$(this).val('');
			};
		}).focus();
		
		$('#shoutbox div').css('visibility', 'visible');
		
		
	} else {
		$(this).parent().css({'height': '18px', 'width': '26px'});
		$('#shoutbox input').remove();
		$('#shoutbox div').css('visibility', 'hidden');
	};
});









// AVATAR LOADER
$('#avatar').click(function () {
	
	myPopup(genThumbs('av', 30), 335,370, 1000);
	$('.avatars').click(function () {
		var img = $(this).attr("src");
		$('#avatar').attr('src', img).hide().fadeIn(1000);
	});
	
	setTimeout( function () {$('.avatars').fadeIn(1000)}, 2500);
	


	$('#avatar').click(function () {
		return false;
	});
});

});
  
var genThumbs = function(prefix, imgCount){
	var img = '';
	for(var i = 1; i <= imgCount; i += 1){
		img += "<img style=\"display : none;\" src=\"../images\\" + prefix + i + ".jpg\" id=\"" + prefix + i + "\" class=\"avatars\"/>";
	};
	return img;
};

var myPopup = function (text, height, width, delay) {		
	if ($('body').find('#myPopup').html() !== undefined) {
		$('#myPopup').remove();	
	};				
	$('body').append('<div id="myPopup" style="display : none;">' + text + '<button type="button">X</button></div>');		
	
	$('#myPopup').css({
		'background-color': '#BBBBBB',
		'border': '3px solid #9797A6',
		'border-radius' : '15px',
		'padding-top' : '5px',
		'padding-left' : '5px',
		'padding-bottom' : '5px',
		'padding-right' : '30px',
		'position':'absolute',
		'top':  '250px',		
		'left': '500px',
		'height': height + 'px',
		'width': width + 'px',
		'box-shadow' : '5px 5px 10px 10px #000000'
	});		
	$('#myPopup button').css({ 
		'position':'absolute',
		'right': '5px',
		'top': '5px',
		'width' : '25px',
		'height' : '25px'
	}).click(function () {
		$('#myPopup').remove();			
	});		
	$('#myPopup').fadeIn(delay);	
};