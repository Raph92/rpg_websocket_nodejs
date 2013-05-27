'use strict';
/* Popup window generator */
var myPopup = function (text, delay) {    
  if ($('body').find('#myPopup').html() !== undefined) {
    $('#myPopup').remove();  
  };        
  $('body').append('<div id="myPopup" style="display : none;">' 
  + text + '<input class="button_input" type=button id="close_popup" value="X"></input></div>');    
  
  $('#myPopup').css({  'left': '150px', 'top' : '150px', 'height' : '340px', 'width' : '340px' });    
  
  $('#close_popup').click(function () {
    $('#myPopup').remove();
  
  });
  
  if (delay) {
    setTimeout( function () {
      $('#myPopup').remove();
    }, delay);
  };
  
  $('#myPopup').fadeIn(100);  
};

var fsMsg = function (text, delay) {    
  $('body').append('<p id="fsMsg" style="display : none;">' 
  + text + '</p>');    
  
  setTimeout( function () {
    $('#fsMsg').remove();
  }, delay);
  
  $('#fsMsg').fadeIn(1000);  
};

var myInterface = function () {
  $('area[title="Wyloguj"]').tooltip({
    track: true
  });
};

/* Write msg received on shoutbox */
var shoutboxCatchMsg = function (data) {
  $('#shoutbox div')
    .append('<p>' + data + '</p>')
    .animate({scrollTop: $('#shoutbox div').prop("scrollHeight")}, 0);
  $('#shoutbox span').css('display', 'none').fadeIn(500);
};

/* Interface for shoutbox, and send msg operation */
var shoutboxInterface = function(socket) {
  $('#shoutbox input')
  .css('visibility', 'visible')
  .keyup(function(e){
    if (e.keyCode === 13 && $(this).val() !== ''){
      var shoutboxInput = $(this).val();
        socket.emit('msg', shoutboxInput);
      $(this).val('');
    };
  // }).focus();
  });
};

var getStatistics = function (socket) {
  $.getJSON("/statistics", function(data) {
    $('#statistics').html(data);
    loadMap(socket);
  });
};

var showPlayers = function (data, socket) {
  var players = '<table>';
  for (var i = 0; i < data.length; i += 1) {
    if (i % 3 === 0 && i > 0) players += '<tr>';
    players += '<td><p><img name="att" src="../images/attack_icon.png" class="op-icons" /><span>' + data[i] + 
               '</span></p></td>';
    if (i % 3 === 0 && i > 0) players += '</tr>';
  };
  players += '</table>';
  $('#players').html(players);
  runBattleScripts(socket);
};

var divCenters = function (div) { 
  var divLeft, 
    divWidth,
    divTop,
    divHeight;
  
  divLeft = div.css('left');
  divLeft = parseInt(divLeft.slice(0, divLeft.length - 2), 10);
  divWidth = div.css('width');
  divWidth = parseInt(divWidth.slice(0, divWidth.length -2), 10);
  
  divTop = div.css('top');
  divTop = parseInt(divTop.slice(0, divTop.length - 2), 10 );
  divHeight = div.css('height');
  divHeight = parseInt(divHeight.slice(0, divHeight.length - 2), 10);
  
  var point = [];
  point.push(divLeft + divWidth /2); // x
  point.push(divTop + divHeight /2); // y
  return point;
};
  
/* Draw lines between divs (ax,ay,bx,by) */
var drawLines = function ( points , canvas) { 
  var canvas = document.getElementById(canvas);
  if (canvas.getContext) {
    var c = canvas.getContext('2d');
      c.clearRect(0,0,canvas.width,canvas.height);
      var gradient = c.createLinearGradient(points[0],points[1],points[2],points[3]);
      gradient.addColorStop("0","#FFFFFF");
      c.lineCap = 'round';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(points[0],points[1]);
      c.lineTo(points[2],points[3]);
      c.strokeStyle = gradient;
      c.arc(points[2],points[3],3,0,Math.PI*2,true);
      c.stroke();
  };
};

var loadMap = function (socket) {
  $('#map').html('<img src="../images/mapa.jpg"/><canvas width="267" height="267" id="can"></canvas>')
           .css('background', 'transparent')
           .append('<div title="Wysypisko" name="garbage" style="position:absolute;width: 45px;' +
           'height: 45px; bottom:10px; left: 100px; z-index: 100"></div>' + 
           '<div title="Bar" name="rostok" style="position:absolute;width:30px;height:30px;' +
           'top: 130px; left: 110px; z-index: 100"></div>' +
           '<div title="Jantar" name="yantar" style="position:absolute;width:25px;height:35px;' +
           'top: 150px; left: 35px; z-index: 100"></div>' +
           '<div title="Agroprom" name="agroprom" style="position:absolute;width:35px;height:35px;' +
           'top: 230px; left: 45px; z-index: 100"></div>' +
           '<div title="Czarna Dolina" name="darkvalley" style="position:absolute;width:55px;height:75px;' +
           'top: 190px; left: 180px; z-index: 100"></div>');
  // First place load
  $('div[name="' + $('#statistics span').text() + '"]').fadeOut(0).addClass('actual-place').fadeIn(2000);
  $('#gaming').fadeOut(0).css('background-image', 'url(../images/' + $('#statistics span').text() + '.jpg)').fadeIn(0);
  
  /* Function to calculate divs center */
  
  
  /* Function fun after click on another place */
  var travel = function () { 
    $('#map div').unbind('click');  
    setTimeout( function () {
      $('#map div').click(travel)
      .tooltip({
        track: true
      });
    }, 3000);  
    
    $('#can').fadeIn(0);
    var cords = divCenters($('div.actual-place')); // Cords of previous div
    
    $('div.actual-place').fadeOut(0).removeClass('actual-place').fadeIn(0);
    $(this).fadeOut(0).addClass('actual-place').fadeIn(1000);
    
    drawLines(cords.concat(divCenters($('div.actual-place'))), 'can'); // Draw lines beetwen old and new div
    $('#can').fadeOut(2000);
    
    // Load place background to gaming div
    $('#gaming').fadeOut(0).css('background-image', 'url(../images/' + $('div.actual-place').attr('name') + '.jpg)').fadeIn(0);
    
    socket.emit('travel', { where: $('div.actual-place').attr('name') });
    
  };
  
  $('#map div').click(travel)
  .tooltip({
    track: true
  });
};


