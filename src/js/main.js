/*||
||||    EARTHTAB CHROME EXTENSION
||||
||||    Scrapes /r/earthporn and makes the top image
||||    your new tab background image.
||||
||||    v0.4.0 (Beta)
||||
||||    Dave Lunny 2015 (c) Licenced under MIT
||||
||||*/



module.exports = (function(){

  var $ = require('./modules/utils.js')();

  var Clock = require('./modules/clock.js')('.js-time');
      Clock.setClock();


  var UsedImages = require('./modules/usedImages.js')();
      UsedImages.init();


  var Settings = require('./modules/settings.js')();
      Settings.init(function(){
        console.log("Cool bro");
      });

  var Data = require('./modules/data.js')( UsedImages );
      // Data.fetch(  );

})();
