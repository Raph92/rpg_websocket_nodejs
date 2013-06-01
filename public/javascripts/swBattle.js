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
  
  id = id.slice(6);
  id = id.split('-');

  return {
    x : parseInt(id[0], 10),
    y : parseInt(id[1], 10)
  };
};

var generateMap = function (att_x, att_y, att_faction, def_x, def_y, def_faction) {
  $('#gaming').empty();
  $('#gaming').css('background', 'url(../images/arena.jpg)');
  

  $('#gaming').append('<canvas width="517" height="267" id="battleCanvas"></canvas>')
              .css('cursor', 'url(../images/cross1.cur), auto');

              
              
   var htmlGaming = '';
   for (var i = 0; i < 6; i += 1) {
     for (var j = 0; j < 12; j += 1) {
        htmlGaming += '<div id="' + i + '-' + j + '" class="battleDivs" style=" width: 40px; height: 40px;' +
        'position: absolute; top: ' + (i * 42) + 'px; left: ' + (j * 42) + 'px;">';
        
        if (i === att_y && j === att_x) {
          htmlGaming += '<img src="../images/' + att_faction + '_model.png" style="position:relative; bottom: 65px"></img>';
        }
        if (i === def_y && j === def_x) {
          htmlGaming += '<img src="../images/' + def_faction + '_model.png" style="position:relative; bottom: 65px"></img>';
        }

        htmlGaming += '</div>';
     };
   };
   
   $('#gaming').append(htmlGaming);
   console.log(htmlGaming);
   
   
  





};
 