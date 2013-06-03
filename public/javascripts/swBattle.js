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
  $('#map div').unbind('click'); 
  
  $('#gaming').empty();
  $('#gaming').css('background', 'url(../images/arena.jpg)');

  $('#gaming').append('<canvas width="517" height="267" id="battleCanvas"></canvas>')
              .css('cursor', 'url(../images/aim_red.cur), auto');
              
  var htmlGaming = '';
  for (var i = 0; i < 5; i += 1) {
   for (var j = 0; j < 12; j += 1) {
      htmlGaming += '<div id="place' + j + '-' + i + 
      '" class="battleDivs" style="border: 1px solid black; width: 41px; height: 41px;' +
      'position: absolute; top: ' + (i * 43) + 'px; left: ' + (j * 43) + 'px;">';
      
      if (i === data.att_y && j === data.att_x) {
        htmlGaming += '<img tabindex="-1" id="attacker" src="../images/' + data.att_faction + 
        '_model.png" style="position:relative; bottom: 65px" class="models"></img>';
      }
      if (i === data.def_y && j === data.def_x) {
        htmlGaming += '<img tabindex="-1" id="defender" src="../images/' + data.def_faction + 
        '_model.png" style="position:relative; bottom: 65px" class="models"></img>';
      }
  
      htmlGaming += '</div>';
   };
  };
  
  $('#gaming').append(htmlGaming);

  $('#gaming').append('<span id="a-hp" class="hp-count" style="position: absolute; bottom: 0px; left: 0px"></span>' + 
                      '<span id="d-hp" class="hp-count" style="position: absolute; bottom: 0px; right: 0px"></span>');
  
  $('#gaming').append('<span id="a-nick" class="bat-nick" style="position: absolute; bottom: 20px; left: 0px"></span>' + 
                      '<span id="d-nick" class="bat-nick" style="' + 
                      'position: absolute; bottom: 20px; right: 0px"></span>');
  
  $('#a-hp').text(data.att_life + 'HP').css('margin-left', '5px');
  $('#d-hp').text(data.def_life + 'HP').css('margin-right', '5px');
  
  $('#a-nick').text(data.att_nick).css('margin-left', '5px');
  $('#d-nick').text(data.def_nick).css('margin-right', '5px');
  
  
  $('#gaming').append('<img name="str" title="+10 Siła"id="str-pot" ' + 
                      'src="../images/str_potion_skill.png" style="position: absolute;' + 
                      'bottom: 0px; left: 35%"></img>' + 
                      '<img name="acc" title="+10 Celność"id="acc-pot" ' +
                      'src="../images/acc_potion_skill.png" style="position: absolute;' + 
                      'bottom: 0px; left: 45%"></img>' +
                      '<img name="hp" title="+50 Życia"id="hp-pot" ' + 
                      'src="../images/hp_potion_skill.png" style="position: absolute;' + 
                      'bottom: 0px; left: 55%"></img>');
  
  $('#gaming img').tooltip({
    track: true
  });
  
  if ($('#inventory span:eq(3)').text() !== '0') {
    $('#hp-pot').click( function () {
      socket.emit('potion', $(this).attr('name')); 
      $('#hp-pot').css('opacity', '0.5').unbind('click');
    });
  } else {
    $('#hp-pot').css('opacity', '0.5');
  };
  
  if ($('#inventory span:eq(4)').text() !== '0') {
    $('#str-pot').click( function () {
      socket.emit('potion', $(this).attr('name')); 
      $('#str-pot').css('opacity', '0.5').unbind('click');
    });
  } else {
    $('#str-pot').css('opacity', '0.5');
  };
  
  if ($('#inventory span:eq(5)').text() !== '0') {
    $('#acc-pot').click( function () {
      socket.emit('potion', $(this).attr('name')); 
      $('#acc-pot').css('opacity', '0.5').unbind('click');
    });
  } else {
    $('#acc-pot').css('opacity', '0.5');
  };
  
  
  
  
  if (role === 'attacker') {
    $('#attacker').focus();
  } else {
    $('#defender').focus();
  };
  
  var playerWalking = function (e) {
    $('#gaming').unbind('keydown');
    
    setTimeout( function () {
      $('#gaming').keydown( function (e) {
        playerWalking(e);
      });
    }, 600);
    
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
  
  });
  
  var playerShooting = function (place) {
    var gunSound = new Audio("../sounds/ak.wav");
    gunSound.play();
    
    // UNBIND EVENT
    $('.battleDivs').unbind('click');
    $('#gaming').css('cursor', 'crosshair');
    
    // BIND EVENT AGAIN AFTER (PREVENT SPAM SHOOTING)
    setTimeout( function () {
      $('#gaming').css('cursor', 'url(../images/aim_red.cur), auto');
      $('.battleDivs').click( function () {
        playerShooting($(this));
      });
    }, 750);
    
    // ACTIONS OF SINGLE EVENT
    
    
    
    place.append('<img id="last-bloody" src="../images/blood.png"></img>');
    
    setTimeout(function () {
      $('#last-bloody').remove();
    
    },500);
    
    
    // place.css('background-image', 'url(../images/blood.png)'); // SMASH MONSTER!
    
    var cords = idUnparse(place);
    
    socket.emit('shooting', cords);
    
    
    console.log(cords);
    
    $('.models').focus();
    
  };
  
  $('.battleDivs').click(function () {
    playerShooting($(this));
  });
  
  
  
  
  
};