var runBattleScripts = function (socket) {
  $('.op-icons').click(function (){
    var opponent = $(this).next().text();
    socket.emit('attack', opponent);
  });
};

var fightInfo = function (data) {
  fsMsg(data.who + ' atakuje!', 2000);
};

var idUnparse = function (div) {
  var id = div.attr('id');        
  
  id = id.slice(5);
  id = id.split('-');

  return {
    x : parseInt(id[0], 10),
    y : parseInt(id[1], 10)
  };
};

var generateMap = function (data, socket) {
  var role = data.role;

  $('#gaming').empty();
  $('#gaming').css('background', 'url(../images/arena.jpg)');

  $('#gaming').append('<canvas width="517" height="267" id="battleCanvas"></canvas>')
              .css('cursor', 'url(../images/aim_red.cur), auto');
              
  var htmlGaming = '';
  for (var i = 0; i < 6; i += 1) {
   for (var j = 0; j < 12; j += 1) {
      htmlGaming += '<div id="place' + j + '-' + i + 
      '" class="battleDivs" style=" width: 40px; height: 40px;' +
      'position: absolute; top: ' + (i * 42) + 'px; left: ' + (j * 42) + 'px;">';
      
      if (i === data.att_y && j === data.att_x) {
        htmlGaming += '<img tabindex="-1" id="attacker" src="../images/' + data.att_faction + 
        '_model.png" style="position:relative; bottom: 65px"></img>';
      }
      if (i === data.def_y && j === data.def_x) {
        htmlGaming += '<img tabindex="-1" id="defender" src="../images/' + data.def_faction + 
        '_model.png" style="position:relative; bottom: 65px"></img>';
      }
  
      htmlGaming += '</div>';
   };
  };
  
  
  $('#gaming').append(htmlGaming).focus();
  
  
  if (role === 'attacker') {
    $('#attacker').css('border', '1px solid blue').focus();
  } else {
    $('#defender').css('border', '1px solid green').focus();
  };
  
  var playerWalking = function (e) {
    $('#gaming').unbind('keydown');
    
    setTimeout( function () {
      $('#gaming').keydown( function (e) {
        playerWalking(e);
      });
    }, 100);
    
    switch(e.which) {
      case 37: { // LEFT
          socket.emit('move', 'left');
        };
        break;
      case 38: { // UP
          socket.emit('move', 'up');
        };
        break;
      case 39: { // RIGHT
          socket.emit('move', 'right');
        };
        break;
      case 40: { // DOWN
          socket.emit('move', 'down');
        };
        break;
      default: return;
    e.preventDefault();
    };
  };
  
  $('#gaming').keydown(function (e){
    playerWalking(e);
  });


  socket.on('on-move', function (data) {
    if (data.stat === 'attacker') {
      var model = $('#attacker').attr('src');
      $('#attacker').remove();
      
      $('#place' + data.x + '-' + data.y).append('<img tabindex="-1" id="attacker" src="'
      + model + '" style="position:relative; bottom: 65px"></img>');
      $('#attacker').focus();
    };
    if (data.stat === 'defender') {
      var model = $('#defender').attr('src');
      $('#defender').remove();
      
      $('#place' + data.x + '-' + data.y).append('<img tabindex="-1" id="defender" src="'
      + model + '" style="position:relative; bottom: 65px"></img>');
      $('#defender').focus();
    };
    
    console.log(data);
  
  });



};