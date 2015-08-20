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

  var Data = require('./modules/data.js')( UsedImages );
      // Data.fetch(  );

})();

},{"./modules/clock.js":2,"./modules/data.js":3,"./modules/settings.js":4,"./modules/usedImages.js":5,"./modules/utils.js":6}],2:[function(require,module,exports){
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


var Data = function( UsedImages ){

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

        /*
        //  loops thru the reddit data and supplies a valid top image to be saved and used
        loopThruRedditDataForTopImg( newData, function( newImage ){

          //  if loopThruRedditDataForTopImg did not yeild any results, we need to fetch new data
          if( newImage.error ){

            //  for all the inital ones, fetchRound isn't even passed in, so if that's the case we need to start it
            if(!fetchRound)
              fetchRound = 1;
            else
              fetchRound++; // increment the fetchRound if it exists

            //  data used to build the URL
            var n     = newImage.name,
                s     = newImage.subreddit,
                count = 25 * fetchRound;

            //  nice little warning
            console.warn("Failed to find a suitable image in "+count+" images, fetching new Reddit data!");

            //  NOT YOUR USUAL fetchRedditData,
            //  this time we pass the fetchRound through to fetchRedditData
            fetchRedditData( parseRedditData, "http://www.reddit.com/r/"+s+"/.json?count="+count+"&after="+n, fetchRound );
          }else{
            //clear localstorage before we do a set
            removeItemFromLocalStorage('oldData');
            saveNewImageInfo( newImage );
            setStuff(GetData( newImage ));//sets DOM elements
          }
        });
        */

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
},{}],4:[function(require,module,exports){
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
},{"./utils.js":6}],5:[function(require,module,exports){




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
},{}],6:[function(require,module,exports){
/*||
||||   Module::Utils
||||
||||   Some utility functions cause yay
*/


var Utils = function(){
  return {
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
    }
  }
};


module.exports = Utils;
},{}]},{},[1]);
