'use strict';
/* Popup window generator */
var myPopup = function (text, delay) {    
  if ($('body').find('#myPopup').html() !== undefined) {
    $('#myPopup').remove();  
  };        
  $('body').append('<div id="myPopup" style="display : none;">' 
  + text + '</div>');    
  
  $('#myPopup').css({  'left': '150px', 'top' : '150px', 'height' : '340px', 'width' : '340px' });    
  
  setTimeout( function () {
    $('#myPopup').remove();
  }, delay);
  
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

/* Write msg received on shoutbox */
var shoutboxCatchMsg = function (data) {
  $('#shoutbox div')
    .append('<p>' + data + '</p>')
    .animate({scrollTop: $('#shoutbox div').prop("scrollHeight")}, 0);
  $('#shoutbox span').css('display', 'none').fadeIn(500);
};

/* Interface for shoutbox, and send msg operation */
var shoutboxInterface = function(socket) {
  $('#shoutbox input').keyup(function(e){
    if (e.keyCode === 13 && $(this).val() !== ''){
      var shoutboxInput = $(this).val();
        socket.emit('msg', shoutboxInput);
      $(this).val('');
    };
  }).focus();
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

var loadMap = function (socket) {
  $('#map').html('<img src="../images/mapa.jpg"/><canvas width="340" height="340" id="can"></canvas>');
  $('#map').append('<div title="Wysypisko" name="garbage" style="position:absolute;width: 50px;' +
           'height: 50px; bottom:15px; left: 130px; z-index: 100"></div>' + 
           '<div title="Bar" name="rostok" style="position:absolute;width:30px;height:30px;' +
           'top: 165px; left: 140px; z-index: 100"></div>' +
           '<div title="Jantar" name="yantar" style="position:absolute;width:30px;height:40px;' +
           'top: 190px; left: 45px; z-index: 100"></div>' +
           '<div title="Agroprom" name="agroprom" style="position:absolute;width:40px;height:40px;' +
           'top: 295px; left: 60px; z-index: 100"></div>' +
           '<div title="Czarna Dolina" name="darkvalley" style="position:absolute;width:60px;height:80px;' +
           'top: 240px; left: 235px; z-index: 100"></div>');
  // First place load
  $('div[name="' + $('#statistics span').text() + '"]').fadeOut(0).addClass('actual-place').fadeIn(2000);
  $('#gaming').fadeOut(0).css('background-image', 'url(../images/' + $('#statistics span').text() + '.jpg)').fadeIn(1000);
  
  /* Function to calculate divs center */
  var divCenters = function () { 
    var divLeft, 
      divWidth,
      divTop,
      divHeight,
      $divToCalc;
    
    $divToCalc = $('div.actual-place');
    
    divLeft = $divToCalc.css('left');
    divLeft = parseInt(divLeft.slice(0, divLeft.length - 2), 10);
    divWidth = $divToCalc.css('width');
    divWidth = parseInt(divWidth.slice(0, divWidth.length -2), 10);
    
    divTop = $divToCalc.css('top');
    divTop = parseInt(divTop.slice(0, divTop.length - 2), 10 );
    divHeight = $divToCalc.css('height');
    divHeight = parseInt(divHeight.slice(0, divHeight.length - 2), 10);
    
    var point = [];
    point.push(divLeft + divWidth /2); // x
    point.push(divTop + divHeight /2); // y
    return point;
  };
    
  /* Draw lines between divs (ax,ay,bx,by) */
  var drawTravelLines = function ( points ) { 
    var canvas = document.getElementById('can');
    if (canvas.getContext) {
      var c = canvas.getContext('2d');
        c.clearRect(0,0,340,340);
        c.lineCap = 'round';
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(points[0],points[1]);
        c.lineTo(points[2],points[3]);
        c.stroke();
    };
  };
  
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
    var cords = divCenters(); // Cords of previous div
    
    $('div.actual-place').fadeOut(0).removeClass('actual-place').fadeIn(0);
    $(this).fadeOut(0).addClass('actual-place').fadeIn(1000);
    
    drawTravelLines(cords.concat(divCenters())); // Draw lines beetwen old and new div
    $('#can').fadeOut(2000);
    
    // Load place background to gaming div
    $('#gaming').fadeOut(0).css('background-image', 'url(../images/' + $('div.actual-place').attr('name') + '.jpg)').fadeIn(2500);
    
    socket.emit('travel', { where: $('div.actual-place').attr('name') });
    
  };
  
  $('#map div').click(travel)
  .tooltip({
    track: true
  });
};


