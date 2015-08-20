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

  var Settings = require('./modules/settings.js')();
      Settings.init(function(){
        console.log("Cool bro");
      });

      




})();

},{"./modules/clock.js":2,"./modules/settings.js":3,"./modules/utils.js":4}],2:[function(require,module,exports){
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
},{"./utils.js":4}],4:[function(require,module,exports){
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
