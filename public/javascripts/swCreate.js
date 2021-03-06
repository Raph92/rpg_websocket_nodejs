/* EVENTS ADDED FOR GENERATE INTERACTIVE CREATE CHARACTER FORM */
var createCharScripts = function () {
  $('#avatar').click(function () {
    $('#avatars_choose').fadeIn(200);
    $('.avatars').click(function () {
      var clicked_img = $(this).attr("src");
      $('#avatar').attr('src', clicked_img);
      $('input[name="avatar"]').val(clicked_img);
      $('#avatars_choose').fadeOut(200);
    });
    $('#close_popup').click(function () {
      $('#avatars_choose').fadeOut(200);
    });
  });
  /* ACTION FOR GET CHARACTER SCHEMAS AND CREATE STAT BUTTON LOGIC */
  $('#create-character select').change(function () {
    $.getJSON("/get-character-schema", { faction: $(this).val() })
      .done(function (json) {
        $('.stats-btn').off('click');
        $('#faction').attr('src', json.image);
        $('input[name="strength"]').val(json.str).prev().text(json.str);
        $('input[name="accuracy"]').val(json.acc).prev().text(json.acc);
        $('input[name="endurance"]').val(json.end).prev().text(json.end);
        $('input[name="points"]').val(json.points).prev().text(json.points);

        $('.stats-btn').click(function () {
          var stat = parseInt($(this).prevAll('span').text(), 10),
            statLimit = parseInt($(this).prevAll('input').val(), 10),
            leftPoints = parseInt($('input[name="points"]').prev().text(), 10),
            operation = $(this).attr('name');
          if (operation === 'plus') {
            if (leftPoints > 0) {
              stat += 1;
              leftPoints -= 1;
              $(this).prevAll('span').text(stat);
              $('input[name="points"]').prev().text(leftPoints);
            } else {
              alert('Brak dostępnych punktów statystyk');
            }
          } else {
            if (stat > statLimit) {
              stat -= 1;
              leftPoints += 1;
              $(this).prevAll('span').text(stat);
              $('input[name="points"]').prev().text(leftPoints);
            } else {
              alert('Nie możesz już zmniejszyć tej statystyki');
            }
          }
        });
      });
  });
  // FIRST GETJSON AFTER LOAD PAGE
  $('#create-character select').trigger('change');
  // INSERT STATS TO INPUT HIDDEN
  $('#crt-char-form').submit(function () {
    var leftPoints = parseInt($('input[name="points"]').prev().text(), 10);
    if ($('input[name="nickname"]').val() === '') {
      alert('Podaj imie');
      return false;
    } else {
      if ($('#avatar').attr('src') === '../images/avatar_none.jpg') {
        alert('Wybierz avatar');
        return false;
      } else {
        if ($('input[name="password"]').val() === '') {
          alert('Podaj hasło');
          return false;
        } else {
          if (leftPoints !== 0) {
            alert('Nie rozdałeś wszystkich punktów statystyk');
            return false;
          } else {
            var str = $('input[name="strength"]').prev().text(),
              acc = $('input[name="accuracy"]').prev().text(),
              end = $('input[name="endurance"]').prev().text();
            $('input[name="strength"]').val(str);
            $('input[name="accuracy"]').val(acc);
            $('input[name="endurance"]').val(end);
            return true;
          }
        }
      }
    }
  });
};