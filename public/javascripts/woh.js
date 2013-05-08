$(document).ready(function () {
'use strict';
var socket = io.connect('http://localhost:3000');
	
    console.log('connecting…');
    socket.on('connect', function () {
        console.log('Połączony!');
    });



	$('.mng-btn').click(function () {
		$(this).hide().fadeIn(100);
		

	});

	
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


// $(function() {
    // $( "#popo" ).dialog();
  // });


  

  
  
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