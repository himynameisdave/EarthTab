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

  //  this tends to be called in the individual modules so we may not need this
  var $   = require('./modules/utils.js')(),
      DOM = require('./modules/dom.js');

  var Clock = require('./modules/clock.js')('.js-time');
      Clock.setClock();


  var Flipper = require('./modules/flipper.js')();
      Flipper.setup({
                      el:       'js-flip-container',
                      targetEl: 'js-flip-container',
                      open:     'i-container-s-open',
                      close:    'i-container-s-closed'
                    });


  var UsedImages = require('./modules/usedImages.js')();
      UsedImages.init();


  var settingsElements = {
        settings: $.resolveElement('.settings'),
        openSettings: $.resolveElement('.js-settings-controller')
      },
      Settings = require('./modules/settings.js')(settingsElements);
      Settings.init(function(){
        console.log("Cool bro");
      });

  //  Here's the elements that will get stuff set
  //  We set them up here for easier access
  var elements = {
    author:          '.js-username',
    backgroundImage: '.js-img',
    userLink:        '.js-username',
    redditLink:      '.js-time-posted',
    subreddit:       '.js-subreddit',
    title:           '.js-title',
    timePosted:      '.js-time-posted'
  };

  var Data = require('./modules/data.js')( UsedImages, elements );
      Data.storage.get(
        //  TODO: can we split this out somewhere? an init fn or something?
        function(d){
          //  some vars
          var randomSub,
              maxMins   = 5;
          //  FIX for #25 - data was found kinda, but no actual url to use
          if( d.lastImage && d.lastImage.url ){
            //  As of v0.4.0 frequency can no longer be set/is overridden here
            if($.longerThanMins( d.lastImage.timeSaved, maxMins )){
              console.info("It's been longer than "+maxMins+" mins, fetching new data!");
              if( Settings.initComplete )
                randomSub = Settings.gimmieARandomActiveSub().toLowerCase();
              else
                throw "Hey the Settings weren't initialized when trying to get a random sub";

            }else{
              console.info("It's been less than "+maxMins+" mins, using old data!");
              if( !d.lastImage.base64Img ){
                // do some base64 conversion stuff, somehow
              }
              DOM( d.lastImage ).setAll( elements );
            }
          }else{
            //  no last image found, gotta get started!
            if( Settings.initComplete ){
              randomSub = Settings.gimmieARandomActiveSub().toLowerCase();
              Data.fetch( Data.parse, "http://www.reddit.com/r/"+randomSub+"/.json" )
            } else { throw "Hey the Settings weren't initialized when trying to get a random sub"; }
          }
        }
      );


})();
