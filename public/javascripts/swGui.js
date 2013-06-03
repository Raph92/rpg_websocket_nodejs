'use strict';
/* Popup window generator */
var myPopup = function (text, delay, height, width) {    
  var popupHeight = height  || '340',
      popupWidth  = width   || '340';
  
  if ($('body').find('#myPopup').html() !== undefined) {
    $('#myPopup').remove();  
  };        
  $('body').append('<div id="myPopup" style="display : none;">' 
  + text + '<input class="button_input" type=button id="close_popup" value="X"></input></div>');    
  
  $('#myPopup').css({  'left': '250px', 'top' : '150px', 'height' : popupHeight + 'px', 
                       'width' : popupWidth + 'px' });    
  
  $('#close_popup').click(function () {
    $('#myPopup').remove();
  
  });
  
  if (delay !== 0) {
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

var getStatistics = function (socket, mapLoader) {
  $.getJSON("/statistics", function(data) {
    $('#statistics').html('<table><tr><td></td><td></td><td rowspan=8><img class="avatars" src="' + 
                          data.avatar + '"/><br/><img class="avatars" src="../images/faction_' + 
                          data.faction + '.png"/></td></tr><tr><td>Imię</td><td>' + 
                          data.nick + '</td></tr><tr><td>Poziom</td><td>' + 
                          data.level + '</td></tr><tr><td>Dmg: </td><td>' + 
                          parseInt(data.str, 10) * 1.5 + '</td></tr><tr><td>Headshoot: </td><td>' + 
                          parseInt(data.acc, 10) + '%</td></tr><tr><td>Życie: </td><td>' + 
                          data.life + 
                          ' HP</td></tr><tr><td colspan=2><img class="stat-icons" src="../images/str_icon.png"/>' + data.str + '<img class="stat-icons" src="../images/acc_icon.png"/>' + 
                          data.acc + '<img class="stat-icons" src="../images/end_icon.png"/>' + 
                          data.end + '</td></tr>' + '<tr><td colspan=2><img class="stat-icons"' +
                          'src="../images/money.png"/>' + data.money + ' RU</td></tr></table>' +
                          '<span style="visibility: hidden">' + data.place + '</span>');
    $('#inventory').html('<table><tr><td colspan="3"><img name="weapon" title="Karabin" class="item" ' +
                         'src="../images/ak_weapon.png"></img></td></tr><tr><td>' +
                         '<img name="armor" title="Pancerz" class="item" src="../images/armor_' + data.faction + '.png"></img></td>' + 
                         '<td><img name="scope" title="Trafiaj tam gdzie chcesz" class="item"' + 
                         'src="../images/scope.png"></img>' + 
                         '<img name="firstaid" ' +
                         'title="Pozwala trochę podleczyć rany" class="item"' +
                         ' src="../images/potion_hp.png" style="margin-top:5px;"></img><img name="energetic" ' +
                         'title="Daje niezłego kopa" class="item"' +
                         ' src="../images/potion_str.png" style="m"></img></td><td><img name="vodka" title="Żeby ręce nie latały..." class="item"' + 
                         'src="../images/potion_acc.png"></img></td></tr></table>' + 
                         '<span style="position: absolute; left: 240px; top: 55px;">' + data.weapon + '</span>' + 
                         '<span style="position: absolute; left: 80px; top: 205px;">' + data.armor + '</span>' + 
                         '<span style="position: absolute; left: 190px; top: 105px;">' + data.scope + '</span>' + 
                         '<span style="position: absolute; left: 180px; top: 145px;">' + data.firstaid + '</span>' + 
                         '<span style="position: absolute; left: 172px; top: 206px;">' + data.energetic + '</span>' +
                         '<span style="position: absolute; left: 208px; top: 185px;">' + data.vodka + '</span>')
                  .tooltip({
                    track: true
                  });
    
    $('#inventory img').click(function (){
      socket.emit('shooping', $(this).attr('name'));
    });
    
    if(mapLoader === undefined) {
      loadMap(socket);
    };
  });
};

var showPlayers = function (data, socket) {
  var players = '<table>',
      count = 0;
  
  for (var i in data) {
    if (count % 3 === 0 && count > 0) players += '<tr>';
    players += '<td><p><img name="att" src="../images/faction_' + data[i] + '.png" class="op-icons" /><span>' + i + 
               '</span></p></td>';
    if (count % 3 === 0 && count > 0) players += '</tr>';
  
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


