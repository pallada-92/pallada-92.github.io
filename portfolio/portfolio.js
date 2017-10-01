function update_lang() {
  var lang = window.location.hash
      .replace('#', '')
      .substr(0, 2)
      .toLowerCase();
  var lang_list = ['en', 'ru'];
  if (lang_list.indexOf(lang) == -1) {
    lang = 'en';
  }
  lang_list.forEach(function(lang1) {
    $('.' + lang1).hide();
  });
  $('.' + lang).show();
}

function make_browser() {

  $('.browser').each(function(i, elem) {

    elem = $(elem);

    var img1 = elem.data('img1'),
        size1 = elem.data('size1').split(' '),
        img1w = +size1[0], img1h = +size1[1],
        width = +elem.data('width'),
        shift1 = elem.data('shift1').split(' '),
        s1x = +shift1[0], s1y = +shift1[1];
    var img2 = null;
    if (elem.data('img2')) {
      img2 = elem.data('img2');
      var size2 = elem.data('size2').split(' '),
          img2w = +size2[0], img2h = +size2[1],
          shift2 = elem.data('shift2').split(' '),
          s2x = +shift2[0], s2y = +shift2[1];
    }
    var html = '<div class="title">';
    html += '<div class="button red"></div>';
    html += '<div class="button yellow"></div>';
    html += '<div class="button green"></div>';
    html += '</div>';

    var page = $('<div class="page">');
    var ratio = img1h / img1w;
    if (img2) {
      ratio = Math.max(ratio, img2h / img2w);
    }
    var ratio_str = Math.floor(ratio * 100) + '%';
    var ratio_shift = -Math.floor((width - img1w) * ratio);
    if (!elem.data('fit-height')) {
      ratio_shift += width - img1w;
    }
    page.css(
      'padding-top', 'calc(' + ratio_str + ' + ' +
        ratio_shift + 'px)')
    
    function set_page(img, imgw, sx, sy) {
      page
        .css('background-image', "url('" + img + "')")
        .css('background-size', 'calc(100% - ' +
             (width - imgw) + 'px)')
        .css('background-position', 'calc(50% + ' +
             sx + 'px) calc(50% + ' + sy + 'px)');
    }

    elem
      .css('max-width', width)
      .append(html)
      .append(page)

    if (img2) {
      elem
        .on('mouseover', set_page.bind(null, img2, img2w, s2x, s2y))
        .on('mouseout', set_page.bind(null, img1, img1w, s1x, s1y));
    }

    set_page(img1, img1w, s1x, s1y);
  });
}

$(function() {
  window.onhashchange = update_lang;
  update_lang();
  make_browser();
});
