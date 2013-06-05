/* ADD SOCKET EMIT ACTIONS TO PLAYERS BADGES */
var runBattleScripts = function (socket) {
  $('.op-icons').click(function () {
    var opponent = $(this).next().text();
    socket.emit('attack', opponent);
  });
};
/* INFORM ABOUT ATTACKER */
var fightInfo = function (data) {
  fsMsg(data.who + ' atakuje!', 2000);
};
/* UNPARSE ID */
var idUnparse = function (div) {
  var id = div.attr('id');
  id = id.slice(5);
  id = id.split('-');

  return {
    x : parseInt(id[0], 10),
    y : parseInt(id[1], 10)
  };
};
/* GENERATE MAP FOR BATTLE, MAIN FUNCTION FOR BATTLES */
var generateMap = function (data, socket) {
  var role = data.role,
    battleSound = new Audio("../sounds/load.wav"),
    htmlGaming = '',
    i,
    j,
    playerWalking = function (e) {  // WALKING FUNCTION, SENDS DIRECTION TO SERVER
      $('#gaming').unbind('keydown');
      setTimeout(function () {
        $('#gaming').keydown(function (e) {
          playerWalking(e);
        });
      }, 400);
      switch (e.which) {
      case 37: // LEFT
        socket.emit('move', 'left');
        break;
      case 38: // UP
        socket.emit('move', 'up');
        break;
      case 39: // RIGHT
        socket.emit('move', 'right');
        break;
      case 40: // DOWN
        socket.emit('move', 'down');
        break;
      default:
        return;
      }
      e.preventDefault();
    },
    playerShooting = function (place) { // SHOOTING FUNCTION, SENDS COORDS OF SHOOT
      var gunSound = new Audio("../sounds/ak.wav"),
        cords = idUnparse(place);
      gunSound.play();
      // UNBIND EVENT
      $('.battleDivs').unbind('click');
      $('#gaming').css('cursor', 'crosshair');
      // BIND EVENT AGAIN AFTER (PREVENT SPAM SHOOTING)
      setTimeout(function () {
        $('#gaming').css('cursor', 'url(../images/aim_red.cur), auto');
        $('.battleDivs').click(function () {
          playerShooting($(this));
        });
      }, 400);
      // ACTIONS OF SINGLE EVENT
      socket.emit('shooting', cords);
      $('.models').focus();
    };
  battleSound.play();
  $('#map div').unbind('click');
  $('.op-icons').unbind('click');
  $('#gaming').empty();
  $('#gaming').css('background', 'url(../images/arena.jpg)');
  /* INSERT PLAYER DIVS TO MAP */
  $('#gaming').append('<canvas width="517" height="267" id="battleCanvas"></canvas>')
              .css('cursor', 'url(../images/aim_red.cur), auto');
  for (i = 0; i < 5; i += 1) {
    for (j = 0; j < 12; j += 1) {
      htmlGaming += '<div id="place' + j + '-' + i +
        '" class="battleDivs" style="width: 43px; height: 43px;' +
        'position: absolute; top: ' + (i * 43) + 'px; left: ' + (j * 43) + 'px;">';
      if (i === data.att_y && j === data.att_x) {
        htmlGaming += '<img tabindex="-1" id="attacker" src="../images/' + data.att_faction +
          '_model.png" style="position:relative; bottom: 65px; z-index: 1000" class="models"></img>';
      }
      if (i === data.def_y && j === data.def_x) {
        htmlGaming += '<img tabindex="-1" id="defender" src="../images/' + data.def_faction +
          '_model.png" style="position:relative; bottom: 65px" class="models"></img>';
      }
      htmlGaming += '</div>';
    }
  }
  $('#gaming').append(htmlGaming);
  /* INSERT PLAYERS HP SPAN, AND PLAYERS NICK SPAN */
  $('#gaming').append('<span id="a-hp" class="hp-count" style="position: absolute; bottom: 0px; ' +
    'left: 0px"></span>' + '<span id="d-hp" class="hp-count" ' +
    'style="position: absolute; bottom: 0px; right: 0px"></span>');
  $('#gaming').append('<span id="a-nick" class="bat-nick" style="position: absolute; bottom: 20px; ' +
    'left: 0px"></span>' + '<span id="d-nick" class="bat-nick" style="' +
    'position: absolute; bottom: 20px; right: 0px"></span>');
  $('#a-hp').text(data.att_life + 'HP').css('margin-left', '5px');
  $('#d-hp').text(data.def_life + 'HP').css('margin-right', '5px');
  $('#a-nick').text(data.att_nick).css('margin-left', '5px');
  $('#d-nick').text(data.def_nick).css('margin-right', '5px');
  /* INSERT ITEMS TO USE BAR */
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
  /* CHECK IF WE HAVE ITEMS, AND ALLOW TO USE IT ON BATTLE */
  if ($('#inventory span:eq(3)').text() !== '0') {
    $('#hp-pot').click(function () {
      var itemSound = new Audio("../sounds/potion.wav");
      itemSound.play();
      socket.emit('potion', $(this).attr('name'));
      $('#hp-pot').css('opacity', '0.5').unbind('click');
    });
  } else {
    $('#hp-pot').css('opacity', '0.5');
  }
  if ($('#inventory span:eq(4)').text() !== '0') {
    $('#str-pot').click(function () {
      var itemSound = new Audio("../sounds/potion.wav");
      itemSound.play();
      socket.emit('potion', $(this).attr('name'));
      $('#str-pot').css('opacity', '0.5').unbind('click');
    });
  } else {
    $('#str-pot').css('opacity', '0.5');
  }
  if ($('#inventory span:eq(5)').text() !== '0') {
    $('#acc-pot').click(function () {
      var itemSound = new Audio("../sounds/potion.wav");
      itemSound.play();
      socket.emit('potion', $(this).attr('name'));
      $('#acc-pot').css('opacity', '0.5').unbind('click');
    });
  } else {
    $('#acc-pot').css('opacity', '0.5');
  }
  if (role === 'attacker') {
    $('#attacker').focus();
  } else {
    $('#defender').focus();
  }
  $('#gaming').keydown(function (e) {
    playerWalking(e);
  });
  $('.battleDivs').click(function () {
    playerShooting($(this));
  });
  /* RECEIVED AFTER USING FIRST AID */
  socket.on('potion-result', function (data) {
    if (data.who === 'attacker') {
      $('.hp-count:eq(0)').text(data.life + 'HP');
    } else {
      $('.hp-count:eq(1)').text(data.life + 'HP');
    }
  });
  /* REFRESHES FOCUS EVERY MOMENT */
  setInterval(function () {
    $('.models').focus();
  }, 100);
};