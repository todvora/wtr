$( document ).ready(function() {
    $( "img.clouds" ).click(function() {
      $("div.clouds").show();
      $("div.radar").hide();
    });
    $( "img.radar" ).click(function() {
      $("div.radar").show();
      $("div.clouds").hide();
    });
});