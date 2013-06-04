var generateEventMap = function (data, socket) {
  var giveRand = function (tab) {
    if (!tab) {
      return Math.floor((Math.random() * 100)) % 12;
    } else {
      var i,
        cords = [],
        randCount = ((Math.floor(Math.random() * 100)) % 25) + 5;
      for (i = 0; i < randCount; i += 1) {
        cords.push((Math.floor((Math.random() * 100)) % 4) + 1);
        cords.push(Math.floor((Math.random() * 100)) % 12);
        tab.push(cords);
        cords = [];
      }
    }
  },
    idUnparse = function (div) {
      var id = div.attr('id');
      id = id.slice(6);
      id = id.split('-');
      return {
        x : parseInt(id[0], 10),
        y : parseInt(id[1], 10)
      };
    },
    radiationRain = function () {
      var canvas = document.getElementById('radiationRain');
      if (canvas.getContext) {
        var x = [],
          y = [],
          i,
          c = canvas.getContext('2d'),
          frame = 0;
        for (i = 0; i < 10000; i += 1) {
          x.push(Math.floor((Math.random() * 1000 ) % 518));
          y.push(Math.floor((Math.random() * 1000 ) % 268));
        }
        c.fillStyle = 'red';
        setInterval(function () {
          c.fillRect(x[frame],y[frame],1,1);
          frame += 1;
        }, 10);
      }
    };
  fsMsg(data.name, 5000);
  var roarSound = new Audio("../sounds/event.wav");
  roarSound.play();
  $('#map div').unbind('click');
  $('.op-icons').unbind('click');

  var playerColumn = giveRand(),
    bunkerColumn = giveRand(),
    monsterPositions = [],
    mapMask = [],
    tempMap = [],
    killCounter = 0,
    i,
    j;
  giveRand(monsterPositions);
      // giveRand(cratesPositions);
  for (i = 0; i < 6; i += 1) {
    for (j = 0; j < 12; j += 1) {
      tempMap.push(0);
    }
    mapMask[i] = tempMap;
    tempMap = [];
  }
  $('#gaming').css('background', 'url(../images/grass.jpg)');
  // PLAYER PLACE
  $('#gaming').append('<canvas width="517" height="267" id="eventCanvas"></canvas>' +
                      '<canvas style="z-index: 1" width="517" height="267" id="radiationRain"></canvas>"')
              .css('cursor', 'url(../images/cross1.cur), auto');
  radiationRain();
  var playerDiv = '<div class="player" id="player' + playerColumn + "-" + 5 +
                  '" tabindex="-1" style="z-index: 2;display: inline-block;width: 40px; height: 40px; position: absolute;' +
                  'left: ' + playerColumn * 42 + 'px; top: ' + 5 * 42 + 'px"><img class="playerImg"' +
                  'src="../images/eventModelR.png" style="position: relative; bottom: 50px"></img></div>';
  $('#gaming').append(playerDiv);
  // KILL COUNTER
  $('#gaming').append('<span class="counter" style="position: absolute; bottom: 0px; right: 0px"></span>');
  $('.counter').text(killCounter);
  $('#gaming').append('<span class="timer" style="position:absolute; bottom: 0px; left: 0px"></span>');
  $('.timer').text((data.time / 1000) + 's');
  var timerUpdater = setInterval(function () {
    data.time -= 1000;
    $('.timer').text((data.time / 1000) + 's');
  }, 1000);
  $('.player').focus();
  mapMask[5][playerColumn] =  1;
  // BUNKER PLACE
  var bunkerDiv = '<div class="bunker" style="z-index: 0; display: inline-block; width: 40px; height: 40px; ' +
                  'position: absolute; left: ' + (bunkerColumn * 42) + 'px; top: 0px"><img class="bunkerImg"' +                  'src="../images/bunker.png" style="position: relative;"></img></div>';
  $('#gaming').append(bunkerDiv);
  // MONSTER PLACE
  var monstersDiv = '';
  for (i = 0; i < monsterPositions.length; i += 1) {
    if (mapMask[monsterPositions[i][0]][monsterPositions[i][1]] !== -1) {
      var snorkType = Math.random() > 0.5 ? '1' : '';
      monstersDiv += '<div id="monstr' + monsterPositions[i][1] + '-' + monsterPositions[i][0] + '" class="monsters"' +
                     'style="background-repeat:no-repeat;z-index: 1; display: inline-block; width: 40px; height: 40px; ' +
                     'position: absolute; left: ' + monsterPositions[i][1] * 42 + 'px; top: ' + monsterPositions[i][0] * 42 +
                     'px; background-image: url(../images/snork' + snorkType + '.png)"></div>';
      mapMask[monsterPositions[i][0]][monsterPositions[i][1]] = -1;
    }
  }
  $('#gaming').append(monstersDiv);
  // PLAYER MOVING
  var stalkerWalking = function (e) {
    // $('#gaming').unbind('keydown');
    // setTimeout( function () {
      // $('#gaming').keydown( function (e) {
      // stalkerWalking(e);
      // });
    // }, 250);
    switch (e.which) {
    case 37: // LEFT
      if (idUnparse($('.player')).x > 0) {
        var pos = idUnparse($('.player')),
          x = pos.x,
          y = pos.y;
        if (mapMask[y][x - 1] !== -1) {
          $('.playerImg').attr('src', '../images/eventModelL.png');
          mapMask[y][x] = 0;
          x -= 1;
          mapMask[y][x] = 1;
          $('.player').attr('id', 'player' + x + '-' + y).animate({"left": "-=42px"}, 0);
        }
      }
      break;
    case 38: // UP
      if (idUnparse($('.player')).y > 0) {
        var pos = idUnparse($('.player')),
          x = pos.x,
          y = pos.y;
        if (mapMask[y - 1][x] !== -1) {
          mapMask[y][x] = 0;
          y -= 1;
          mapMask[y][x] = 1;
          $('.player').attr('id', 'player' + x + '-' + y).animate({"top": "-=42px"}, 0);
        }
      }
      break;
    case 39: // RIGHT
      if (idUnparse($('.player')).x < 11) {
        var pos = idUnparse($('.player')),
          x = pos.x,
          y = pos.y;
        if (mapMask[y][x + 1] !== -1) {
          $('.playerImg').attr('src', '../images/eventModelR.png');
          mapMask[y][x] = 0;
          x += 1;
          mapMask[y][x] = 1;
          $('.player').attr('id', 'player' + x + '-' + y).animate({"left": "+=42px"}, 0);
        }
      }
      break;
    case 40: // DOWN
      if (idUnparse($('.player')).y < 5) {
        var pos = idUnparse($('.player')),
          x = pos.x,
          y = pos.y;
        if (mapMask[y + 1][x] !== -1) {
          mapMask[y][x] = 0;
          y += 1;
          mapMask[y][x] = 1;
          $('.player').attr('id', 'player' + x + '-' + y).animate({"top": "+=42px"}, 0);
        }
      }
      break;
    default:
      return;
    }
    e.preventDefault();
    var cords = idUnparse($('.player'));
    if (cords.x === bunkerColumn && cords.y === 0) {
      // SURVIVED
      socket.emit('rescue', killCounter);
      bunkerColumn = -1;
      $('#gaming').unbind('keydown');
      $('.monsters').unbind('click');
      clearInterval(timerUpdater);
    }
  };
  $('#gaming').keydown(function (e) {
    stalkerWalking(e);
  });
  // MONSTER KILLING
  var monsterShooting = function (monster) {
    var gunSound = new Audio("../sounds/gun1.wav"),
      deadSound = (Math.random() > 0.5) ? new Audio("../sounds/snork1.wav") : new Audio("../sounds/snork2.wav");
    gunSound.play();
    // UNBIND EVENT
    $('.monsters').unbind('click');
    $('#gaming').css('cursor', 'crosshair');
    // BIND EVENT AGAIN AFTER (PREVENT SPAM SHOOTING)
    setTimeout(function () {
      $('#gaming').css('cursor', 'url(../images/cross1.cur),auto');
      $('.monsters').click(function () {
        monsterShooting($(this));
      });
    }, 750);
    // ACTIONS OF SINGLE EVENT
    deadSound.play();
    $('#eventCanvas').fadeIn(0);
    var cords = divCenters($('.player')); // PLAYER CORDS
    drawLines(cords.concat(divCenters(monster)), 'eventCanvas'); // DRAW LINES BETWEEN PLAYER AND DIV
    $('#eventCanvas').fadeOut(400);
    monster.css('background-image', 'url(../images/blood.png)'); // SMASH MONSTER!
    setTimeout(function () {
      monster.remove(); // REMOVE, AFTER BLOOD MASSACRE
      $('.player').focus();
    }, 300);
    cords = idUnparse(monster);
    mapMask[cords.y][cords.x] = 0;
    killCounter += 1;
    $('.counter').text(killCounter);
  };
  $('.monsters').click(function () {
    monsterShooting($(this));
  });
};