(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
      // Data.fetch( Data.parse, url );




})();

},{"./modules/clock.js":2,"./modules/data.js":3,"./modules/settings.js":5,"./modules/usedImages.js":6,"./modules/utils.js":7}],2:[function(require,module,exports){
/*||
||||   Module::Clock
||||
||||   Responsible for setting/updating the clock
||||   based on the element selector passed to the function
*/


var Clock = function( element ){
  return {
    el: document.querySelector(element),
    /**   @name:    setClock
      *   @params:  oldTime [number, time; optional]
      *   @desc:    recursivly checks the time and alters it in the DOM
      *             essentially a self-contained worker function
      */
    setClock: function( oldTime ){
      var t = new Date(),
          h = t.getHours(),
          m = t.getMinutes();
          if (m<10) { m = "0"+m; }
          if( h > 12 ){
            h = h - 12;
          }
      var time = h+":"+m;

      if(!oldTime || oldTime !== time)
        this.el.innerHTML = time;

      var timeout = setTimeout(function(){
        this.setClock(this.el, time);
      }.bind(this), 5000);// five seconds is a lot but I'd rather that then taking the performance hit
    }

  }
};

module.exports = Clock;
},{}],3:[function(require,module,exports){
/*||
||||   Module::Data
||||
||||   Gets and sets data in chrome storage, other stuff.
*/

var $   = require('./utils.js')(),
    DOM = require('./dom.js');//  Don't instantiate yet


var Data = function( UsedImages, elements ){

    return {
      fetch: function( cb, url, fetchRound ){
        var r = new XMLHttpRequest();
        r.open("get", url , true);
        r.onload = function(xmlEvent){
          if(!fetchRound)
            cb(JSON.parse(r.response).data.children);
          else
            cb(JSON.parse(r.response).data.children, fetchRound);
        };
        r.send();
      },
      parse: function( newData, fetchRound ){

        var topImg = this.returnTopImage( newData );

        if( !topImg.error ){
          //  removes the item before setting it again
          this.storage.remove();
          this.storage.set( topImg );

          //  store that as a new image
          UsedImages.add({
            id: topImg.id,
            redditLink: topImg.redditLink,
            url: topImg.url,
            time: Date.now()/1000
          }, function(){
            console.log("Successfully added newly used image!");
          });

          //  instantiate the DOM module with our data
          DOM( topImg ).setAll( elements );

        }else {
          console.info("Fetching new batch of images!");
          //  increment the fetchRound
          fetchRound = !fetchRound ? 1 : fetchRound + 1;
          var n     = topImg.name,
              s     = topImg.subreddit,
              count = 25 * fetchRound;
          //  Do our other fetch
          this.fetch( this.parse, "http://www.reddit.com/r/"+s+"/.json?count="+count+"&after="+n, fetchRound  );
        }

      },
      storage: {
        remove: function(){
          chrome.storage.local.remove( "lastImage", function(){
            console.log("Successfully removed lastImage from localStorage!");
          });
        },
        set: function( image ){
          chrome.storage.local.set({'lastImage': image}, function(){
            console.log("Successfully added lastImage to localStorage!");
            $.convertImgToBase64URL( image.url, function(base64data){
              this.setBase64(image,  base64data);
            }.bind(this));
          }.bind(this));
        },
        setBase64: function( d, n64 ){
          var o = d;
              o.base64Img = n64;
          chrome.storage.local.set({'oldData': o}, function(){
            console.log('Saved base64 image to localStorage!');
          });
        }
      },

      returnTopImage: function( data ){
        var obj = {},
          isImageFound = false;

        data.forEach( function( val, i ){
          /***
            *   For each item in the dataset passed in, we are going
            *   to make sure the following conditions are true:
            *
            *     1) the image hasn't been found yet
            *     2) it's not something dumb like a mod post
            *     3) it's from a trusted domain (right now just i.imgur stuff)
            *     4) it's not an image that's already been used
            *
            **/
          if( !isImageFound && this.isValidPost(val.data) && this.isValidDomain(val.data.domain && !this.isUsedImage(val.data) ) ){
            obj = {
              author:     val.data.author,              //  {string}  the reddit user
              bgUrl:      val.data.url,                 //  {string}  will take the place of data.url
              created:    val.data.created_utc,         //  {number}  a timestamp of when this post was created.
              domain:     val.data.domain,              //  {string}  a string of the domain of the post
              id:         val.data.id,                  //  {string}  a unique string that will be used to test if this image has been used yet or not
              name:       val.data.name,                //  {string}  an also unique string that will be used to build our url when fetching more results
              redditLink: 'http://www.reddit.com'+val.data.permalink, //  {string}  link to the reddit post
              title:      this.stripSquareBrackets(val.data.title),   //  {string}  a sanitized string, title of the post
              score:      val.data.score,               //  {number}  a timestamp of when this post was created
              subreddit:  val.data.subreddit,           //  {string}  the subreddit this came from
              url:        val.data.url,                 //  {string}  the url of the image (not the reddit link)
              timeSaved:  Date.now() / 1000             //  {number}  a timestamp of when this data was stored. divided by 1000 so we get the value in seconds
            };
            isImageFound = true;
          }
          if( !obj.url && i === (data.length - 1) ){
            obj.error = true;
            obj.name = val.data.name;
            obj.subreddit = val.data.subreddit;
          }

        }.bind(this));

        return obj;

      },
      isValidPost: function( post ){
        return post.domain === 'self.EarthPorn' || post.author === 'AutoModerator' || post.distinguished === 'moderator' ? false : true;
      },
      isValidDomain: function( domain ){
        //  TODO: this should actually do some domain filtering
        return domain === "i.imgur.com";
      },
      isUsedImage: function( image ){
        var used = false;
        if( !UsedImages.images )
          throw "Where the fuck are my UsedImages!!!"
        if( UsedImages.images.length <= 0 )
          return used;

        //  if we haven't exited the fn early, actually check if it's been used
        UsedImages.images.forEach( function(val){
          if( val.id === image.id )
            used = true;
        });

        return used;
      },
      /**   @name:   stripSquareBrackets
        *   @params: title [string]
        *   @desc:   recursively parses the title to remove stupid [stuff][in][square][brackets]
        *            CAVEAT: only if it's at the end of the string... could have adverse effects - fine for now
        */
      stripSquareBrackets: function( title ){
        var str = title,
            i   = str.lastIndexOf('[');
        if( i > 0 ){
          var toReplace   = str.slice(i,str.length),
              strippedStr = str.replace( toReplace, "" );
            if(strippedStr.lastIndexOf('[') > 0){
              str = stripSquareBrackets(strippedStr);
            }else{
              str = strippedStr;
            }
        }
        return str;
      }


    }
};


module.exports = Data;
},{"./dom.js":4,"./utils.js":7}],4:[function(require,module,exports){
/*||
||||   Module::DOM
||||
||||   Used to set items in the DOM
*/

var $ = require('./utils.js')();


var DOM = function( data ){
  /**   @name:   setInnerHtml
    *   @params: el[string, selector], title[string]
    *   @desc:   takes a selector string and a title and appends that element with the specified content
    */
  var setInnerHtml = function( el, text ){
    var element = document.querySelector(el);
    element.innerHTML = text;
  },
  setLink = function( el, link ){
    var element = document.querySelector(el);
    element.href = link;
  };

  return {
    set: {
      author:          function( el ){
        setInnerHtml( el, data.author );
      },
      backgroundImage: function( el ){
        var element = document.querySelector(el);

        if( !data.base64Img && !data.bgUrl && !data.url )
          throw "Trying to set background, however could not find a base64Img or bgUrl or url in the data set!";

        if(data.base64Img){
          document.styleSheets[0].addRule( el, "background-image: url("+data.base64Img+")" );
          //  wait 200ms so the bg image can load (?)
          setTimeout(function(){
            $.addClass( '.main', 'main-visible' );
          }, 200);
        }else{
          element.style.backgroundImage = "url("+data.bgUrl+")";
          //  wait 200ms so the bg image can load (?)
          setTimeout(function(){
            $.addClass( '.main', 'main-visible' );
          }, 200);
        }
      },
      userLink:        function( el ){
        setLink( el, 'http://www.reddit.com/user/'+data.author+'/' );
      },
      redditLink:      function( el ){
        setLink( els, data.redditLink );
      },
      subreddit:       function( el ){
        setInnerHtml(el, data.subreddit);
        setLink(el, "http://www.reddit.com/r/"+data.subreddit);
      },
      title:           function( el ){
        setInnerHtml( el, data.title );
      },
      timePosted:      function( el ){
        var element = document.querySelector(el),
            now     = Date.now()/1000,
            posted  = data.created;

        setInnerHtml( el, $.truncatePostTime($.getHrsDiff( posted, now )) + " ago" );
      }
    },
    setAll: function( elements ){
      this.set.author( elements.author );
      this.set.backgroundImage( elements.backgroundImage );
      this.set.userLink( elements.userLink );
      this.set.redditLink( elements.redditLink );
      this.set.subreddit( elements.subreddit );
      this.set.title( elements.title );
      this.set.timePosted( elements.timePosted );
    }
  }
};



module.exports = DOM;

},{"./utils.js":7}],5:[function(require,module,exports){
/*||
||||   Module::Settings
||||
||||   Responsible for getting and setting and doing stuff
||||   with the settings/settings object
*/

var $ = require('./utils.js')();


var Settings = function(){
  return {

    Settings: {},
    subList: [  'EarthPorn',
                'SkyPorn',
                'WaterPorn',
                'DesertPorn',
                'WinterPorn',
                'AutumnPorn',
                'SpringPorn',
                'SummerPorn',
                'WeatherPorn',
                'LakePorn',
                'SpacePorn'
              ],
    initComplete: false,
    init: function( cb ){

      this.fetchOldSettings(function(d){
        if(d.settings){
          this.Settings = d.settings;
          this.parseSettings();
          this.initComplete = true;
          //  fire the callback if it exists
          if(cb)
            cb();
        }else{
          var newSettings = this.buildDefaultSettings();
          this.updateSettings( newSettings, function(d){
            this.Settings = newSettings;
            console.log("newSettings: ", newSettings);
            this.parseSettings();
            this.initComplete = true;
            //  fire the callback if it exists
            if(cb)
              cb();
          }.bind(this));
        }
      }.bind(this));
    },
    fetchOldSettings: function( cb ){
      chrome.storage.local.get( 'settings', cb );
    },
    updateSettings: function( settings, cb ){
      chrome.storage.local.set({'settings': settings}, cb);
    },
    buildDefaultSettings: function(){
      var s = {
        currentTheme: 'light',
        subs: [],
        usedImages: []
      };

      this.subList.forEach(function( val, i ){
        var subName = 'sub-'+val.toLowerCase();
        s.subs[i] = {};
        s.subs[i].name  = val;
        s.subs[i].subName  =  subName;
        s.subs[i].active   =  true;
        s.subs[i].html = this.generateSubListItemHtml(s.subs[i]);
      }.bind(this));
      return s;
    },
    generateSubListItemHtml: function( sub ){
      var subName = sub.subName,
          properName = sub.name,
          isActive = sub.active,
          li = "<li class='settings-subreddit-list-item bg-"+subName+"'>";
          li += "<label class='settings-subreddit-label' for='"+subName+"'>";
          li += "<a class='settings-subreddit-label-link' href='http://www.reddit.com/r/"+properName+"/'>"+properName+"</a>";
          li += "</label>";
          li += "<input type='checkbox' class='settings-subreddit-checkbox' id='"+subName+"' name='"+subName+"'";
          if(isActive)
            li += " checked";
          li += " /></li>";

      return li;
    },
    parseSettings: function(){

      this.injectSubs( '.js-settings-subs' );
      //  goes to set up the initial theme based on whatever our theme is
      this.initTheme();
      //  handles setting up the theme
      this.listenForThemeChanges( '.js-theme' );
      //  handles listening to the checkboxes
      this.setupCheckboxChangeListener();

    },
    injectSubs: function( el ){

      var element = $.resolveElement( el ),
          subsListHtml = '';

      this.Settings.subs.forEach(function( val, i ){
        subsListHtml += val.html;
      });

      //  appending it
      element.innerHTML = subsListHtml;

    },
    initTheme: function(  ) {
      if( this.Settings.currentTheme === 'light' ){
        this.setTheme('main-t-light');//TODO: save all this in a config obj
        //  to ensure the proper theme is actually selected
        document.querySelector("#theme-light").checked = true;
      }
      if( this.Settings.currentTheme === 'dark' ){
        this.setTheme('main-t-dark');
        //  to ensure the proper theme is actually selected
        document.querySelector("#theme-dark").checked = true;
      }
    },
    setTheme: function( themeClass ){

      var el = document.querySelector('.main'),
          light = 'main-t-light',
          dark  = 'main-t-dark';

      if( themeClass === light ) {
        if( el.classList.contains(dark) )
          $.removeClass( el, dark );
        if( !el.classList.contains(light) )
          $.addClass( el, light );
        // early return
        return;
      }
      if( themeClass === dark ){
        if( el.classList.contains(light) )
          $.removeClass( el, light );
        if( !el.classList.contains(dark) )
          $.addClass( el, dark );
        // early return
        return;
      }
      throw "What the whaaaa? http://bit.ly/1IjwmfN";
    },
    listenForThemeChanges: function( element ){

      var els = document.querySelectorAll(element),
          This = this;

      if( !els )
        throw "Trying to attach click events to theme radio options but couldn't find those elements!";

      //  TODO: can these be looped thru?
      //  click event for light theme
      els[0].addEventListener('click', function(e){
        this.setTheme('main-t-light');
        this.Settings.currentTheme = 'light';

        this.updateSettings( this.Settings, function(){
          console.log("\nSuccessfully set theme to Light Theme!");
          this.showSaveSettings();
        }.bind(this));
      }.bind(this));
      //  click event for dark theme
      els[1].addEventListener('click', function(e){
        this.setTheme('main-t-dark');
        this.Settings.currentTheme = 'dark';

        this.updateSettings( this.Settings, function(){
          console.log("\nSuccessfully set theme to Dark Theme!");
          this.showSaveSettings();
        }.bind(this));
      }.bind(this));

    },
    setupCheckboxChangeListener: function(){

      this.subList.forEach(function( val, i ){
        var el = document.querySelector( "#sub-" + val.toLowerCase() );

        el.addEventListener('change', function(){

          var isChecked = el.checked,
              currentSub = val,
              thisSub;

          this.Settings.subs.forEach(function(sub, j){
            if(sub.name === currentSub){
              thisSub = j;
            }
          });

          this.Settings.subs[thisSub].active = isChecked;
          this.Settings.subs[thisSub].html = this.generateSubListItemHtml(this.Settings.subs[thisSub]);

          //  Show our save settings alert
          this.showSaveSettings();
          //  actually save da new settings
          this.updateSettings( this.Settings, function(){
            console.log("\nSuccessfully saved settings, using these:");
            console.log( this.Settings );
          }.bind(this));

        }.bind(this));
      }.bind(this));
    },
    isSaveAlertVisible: false,
    settingsAlertShowTime: 1250,
    settingsAlertEl: document.querySelector('.settings-saved-alert'),
    showSaveSettings: function(){
      if( !this.isSaveAlertVisible ){
        var hideClass = 'settings-saved-alert-s-hidden',
            showClass = 'settings-saved-alert-s-visible',
            This = this;

        if( this.settingsAlertEl.classList.contains(hideClass) )
          $.removeClass( this.settingsAlertEl, hideClass );

        $.addClass( this.settingsAlertEl, showClass );
        this.isSaveAlertVisible = true;

        setTimeout(function(){
          if( this.settingsAlertEl.classList.contains(showClass) ){
            $.removeClass( this.settingsAlertEl, showClass );
            $.addClass( this.settingsAlertEl, hideClass );
          }
          this.isSaveAlertVisible = false;
        }.bind(this), this.settingsAlertShowTime);

      }
    }







  };
};

module.exports = Settings;
},{"./utils.js":7}],6:[function(require,module,exports){




var UsedImages = function(){
  return {
    images: [],
    init: function(){
      this.getUsedImages( function( images ){
        this.images = images;
      }.bind(this));
    },
    getUsedImages: function( cb ){
      chrome.storage.local.get( 'usedImages', function( d ){
        if(d.images)
          cb( d.images )
      });
    },
    add: function( newImage, cb ){
      //  TODO: check validity of incoming image
      this.images.push(newImage);

      var usedImages = {
        images: this.images
      };

      chrome.storage.local.set( {'usedImages': usedImages}, function(){
        console.log("Added new used image!");
        cb();
      });
    }
  }
};


module.exports = UsedImages;
},{}],7:[function(require,module,exports){
/*||
||||   Module::Utils
||||
||||   Some utility functions cause yay
*/


var Utils = function(){
  return {
    /**   @name:    addClass
      *   @params:  el [string, selector], class [string]
      *   @desc:    simplifies adding a class to an element
      */
    addClass: function( el, className ){
      var element;
      if( typeof el === 'object' )
        element = el;
      else if( typeof el === 'string' )
        element = document.querySelector( el );
      else
        throw "addClass() needs either an element or a selector string!";
      element.classList.add(className);
    },
    /**   @name:    convertImgToBase64URL
      *   @params:  url [string], callback [function], outputFormat [string]
      *   @desc:    creates a base64 of an image based on a given URL. ASYNC
      *
      *   Mega props to this Stackoverflow post:
      *   http://stackoverflow.com/a/20285053/4060044
      */
    convertImgToBase64URL: function(url, callback, outputFormat){
      var img = new Image();
          img.crossOrigin = 'Anonymous';
          img.onload = function(){
              var canvas = document.createElement('CANVAS'),
              ctx = canvas.getContext('2d'), dataURL;
              canvas.height = img.height;
              canvas.width = img.width;
              ctx.drawImage(img, 0, 0);
              dataURL = canvas.toDataURL(outputFormat);
              callback(dataURL);
              canvas = null;
          };
          img.src = url;
    },
    /**   @name:   getHrsDiff
      *   @params: oldTime [number, timestamp], newTime [number, timestamp]
      *   @desc:   returns the number of hours between two given times, NOT ROUNDED
      */
    getHrsDiff: function( oldTime, newTime ){
      var diff = newTime - oldTime;
      return (diff/60)/60;
    },
    /**   @name:    resolveElement
      *   @params:  el [string, selector OR DOM element object]
      *   @desc:    handy utility that returns the actual element, whether passed a selector string or actual element
      */
    resolveElement: function( el ){
      var element;
      if( typeof el === 'string' )
        element = document.querySelector(el);
      else if( typeof el === 'object' )
        //  TODO: check that it's a real DOM object
        element = el;
      else
        throw "Not a real element!\nPlease pass either a selector string or element object!";
      return element;
    },
    /**   @name:    removeClass
      *   @params:  el [string, selector], class [string]
      *   @desc:    simplifies removing a class from an element
      */
    removeClass: function( el, className ){
      var element;
      if( typeof el === 'object' )
        element = el;
      else if( typeof el === 'string' )
        element = document.querySelector( el );
      else
        throw "removeClass() needs either an element or a selector string!";
      element.classList.remove(className);
    },
    truncatePostTime: function( hrs ){
      var h, s;
      if( hrs < 24 ){
        h = Math.floor(hrs);
        s = (h > 1 ? " hrs" : " hr");
        return h + s;
      }
      if( hrs >= 24 && hrs < 168 ){
        h = Math.floor(hrs/24);
        s = (h > 1 ? " days" : " day");
        return h + s;
      }
      if( hrs >= 168 ){
        h = Math.floor(hrs/168);
        s = (h > 1 ? " weeks" : " week");
        return h + s;
      }
    }
  }
};


module.exports = Utils;
},{}]},{},[1]);
