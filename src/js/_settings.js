/**   @name:    GetSettings
  *   @params:  [none]
  *   @desc:    returns an instance of $ettings with saved, closed settings object and methods for dealing with it
  */
GetSettings = function(){
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
    finishedInit: false,
    init: function(){
      var This = this;//  this is weird but makes sense

      this.fetchOldSettings(function(d){

        if(d.settings) {
          console.log('Using old data for settings');
          This.Settings = d.settings;
          This.parseSettings();
          This.finishedInit = true;
        }else{
          console.log('Using new data for settings');
          var newSettings = This.buildDefaultSettings();
          This.updateSettings( newSettings, function(d){
            console.log('Updated the Settings in localStorage!');
            This.Settings = newSettings;
            This.parseSettings();
            This.finishedInit = true;
          });
        }
      });
    },
    /**   @name:    fetchOldSettings
      *   @params:  cb [callback function]
      *   @desc:    grabs old settings from localStorage, accepts a callback
      */
    fetchOldSettings: function( cb ){
      chrome.storage.local.get( 'settings', cb );
    },
    /**   @name:    updateSettings
      *   @params:  settings [object], cb [callback function]
      *   @desc:    updateSettings goes into chrome storage and saves the new settings
      */
    updateSettings: function( settings, cb ){
      chrome.storage.local.set({'settings': settings}, cb);
    },
    /**   @name:    parseSettings
      *   @params:  [none]
      *   @desc:    does two things for now:
      *               1. inject the subreddits
      *               2. inject the frequency range input ///REMOVED
      */
    parseSettings: function(){

      this.injectSubs( '.js-settings-subs' );
      //  goes to set up the initial theme based on whatever our theme is
      this.initTheme();
      //  handles setting up the theme
      this.listenForThemeChanges( '.js-theme' );
      //  handles listening to the checkboxes
      this.setupCheckboxChangeListener();

    },
    /**   @name:    buildDefaultSettings
      *   @params:  [none]
      *   @desc:    builds out a default settings object
      */
    buildDefaultSettings: function(){
      var s = {
        currentTheme: 'light',
        subs: [],
        usedImages: [],
        favImgs: []
      },
      This = this;

      this.subList.forEach(function( val, i ){
        var subName = 'sub-'+val.toLowerCase();
        s.subs[i] = {};
        s.subs[i].name  = val;
        s.subs[i].subName  =  subName;
        s.subs[i].active   =  true;
        s.subs[i].html = This.generateSubListItemHtml(s.subs[i]);
      });
      return s;
    },
    /**   @name:    generateSubListItemHtml
      *   @params:  sub[object]
      *   @desc:    generates the markup for a given sub object (like from $ettings.subs[i])
      *             TODO: is this really the best way to deal with this?!
      */
    generateSubListItemHtml: function( sub ){
      var subName = sub.subName,
          properName = sub.name,
          isActive = sub.active,
          li = "";
          li += "<li class='settings-subreddit-list-item bg-"+subName+"'>";
          li += "<label class='settings-subreddit-label' for='"+subName+"'>";
          li += "<a class='settings-subreddit-label-link' href='http://www.reddit.com/r/"+properName+"/'>"+properName+"</a>";
          li += "</label>";
          li += "<input type='checkbox' class='settings-subreddit-checkbox' id='"+subName+"' name='"+subName+"'";
          if(isActive){
            li += " checked";
          }
          li += " /></li>";

      return li;
    },
    /**   @name:    injectSubs
      *   @params:  el [selector, string], cb [function]
      *   @desc:    injectSubs adds the subs html to the given element
                    has a callback so that when it's done it's shit it can call "showSettingsAsAvailable"
      */
    injectSubs: function( el, cb ){

      var element = resolveElement( el ),
          subsListHtml = '';

      this.Settings.subs.forEach(function( val, i ){
        subsListHtml += val.html;
      });

      //  appending it
      element.innerHTML = subsListHtml;

      //now we call our callback, if it exists
      if( cb ){ cb();}

    },
    /**   @name:    setupCheckboxChangeListener
      *   @params:  [none]
      *   @desc:    setupCheckboxChangeListener loops through the sublist and
      *             sets up all the the change listeners on the checkboxes
      */
    setupCheckboxChangeListener: function(  ){
      var This = this;
      this.subList.forEach(function( val, i ){
        var el = document.querySelector( "#sub-" + val.toLowerCase() );

        el.addEventListener('change', function(){

          var isChecked = el.checked,
              currentSub = val,
              thisSub;

          This.Settings.subs.forEach(function(sub, j){
            if(sub.name === currentSub){
              thisSub = j;
            }
          });

          This.Settings.subs[thisSub].active = isChecked;
          This.Settings.subs[thisSub].html = This.generateSubListItemHtml(This.Settings.subs[thisSub]);

          //  Show our save settings alert
          This.showSaveSettings();
          //  actually save da new settings
          This.updateSettings( This.Settings, function(){
            console.log("\nSuccessfully saved settings, using these:");
            console.log( This.Settings );
          });

        });
      });
    },
    /**   @name:    logUsedImages
      *   @params:  [none]
      *   @desc:    UTIL for logging all the used images to the console for easy viewing
      */
    logUsedImages: function(){
      console.log(this.Settings.usedImages);
    },
    /**   @name:    showSaveSettings
      *   @params:  [none]
      *   @desc:    uses the isSaveAlertVisible to open/close the "Saved Settings" alert
      */
    isSaveAlertVisible: false,
    settingsAlertShowTime: 1250,
    settingsAlertEl: document.querySelector('.settings-saved-alert'),
    showSaveSettings: function(){
      if( !this.isSaveAlertVisible ){
        var hideClass = 'settings-saved-alert-s-hidden',
            showClass = 'settings-saved-alert-s-visible',
            This = this;

        if( this.settingsAlertEl.classList.contains(hideClass) ){
          removeClass( this.settingsAlertEl, hideClass );
        }
        addClass( this.settingsAlertEl, showClass );
        this.isSaveAlertVisible = true;

        setTimeout(function(){
          if( This.settingsAlertEl.classList.contains(showClass) ){
            removeClass( This.settingsAlertEl, showClass );
            addClass( This.settingsAlertEl, hideClass );
          }
          This.isSaveAlertVisible = false;
        }, This.settingsAlertShowTime);

      }
    },
    /**   @name:    gimmieARandomActiveSub
      *   @params:  [none]
      *   @desc:    loops through the subs, and from the active ones, one is randomly chosen
      */
    gimmieARandomActiveSub: function(){
      var activeSubs = [];

      //  Location of an error... becuase this don't exist yet
      this.Settings.subs.forEach(function(val, i){
        if(val.active) {
          activeSubs.push(val.name);
        }
      });

      var ran = Math.floor(Math.random() * activeSubs.length);

      return activeSubs[ran];
    },
    /**   @name:    initTheme
      *   @params:  [none]
      *   @desc:    sets the initial theme based on the currentTheme in Settings
      */
    initTheme: function(  ) {
      if( this.Settings.currentTheme === 'light' ){
        this.setTheme('main-t-light');
        //  to ensure the proper theme is actually selected
        document.querySelector("#theme-light").checked = true;
      }
      if( this.Settings.currentTheme === 'dark' ){
        this.setTheme('main-t-dark');
        //  to ensure the proper theme is actually selected
        document.querySelector("#theme-dark").checked = true;
      }
    },
    /**   @name:    setTheme
      *   @params:  themeClass [string]
      *   @desc:    takes a theme (as a class) and applies it to the main element
      */
    setTheme: function( themeClass ){

      var el = document.querySelector('.main'),
          light = 'main-t-light',
          dark  = 'main-t-dark';

      if( themeClass === light ) {
        if( el.classList.contains(dark) )
          removeClass( el, dark );
        if( !el.classList.contains(light) )
          addClass( el, light );
        // early return
        return;
      }
      if( themeClass === dark ){
        if( el.classList.contains(light) )
          removeClass( el, light );
        if( !el.classList.contains(dark) )
          addClass( el, dark );
        // early return
        return;
      }
      throw "What the whaaaa? http://bit.ly/1IjwmfN";
    },
    /**   @name:    listenForThemeChanges
      *   @params:  element [string]
      *   @desc:    adds click events to the theme selection radios
      */
    listenForThemeChanges: function( element ){

      var els = document.querySelectorAll(element),
          This = this;

      if( !els )
        throw "Trying to attach click events to theme radio options but couldn't find those elements!";

      //  TODO: can these be looped thru?

      //  click event for light theme
      els[0].addEventListener('click', function(e){
        This.setTheme('main-t-light');
        This.Settings.currentTheme = 'light';

        This.updateSettings( This.Settings, function(){
          console.log("\nSuccessfully set theme to Light Theme!");
          This.showSaveSettings();
        });
      });
      //  click event for dark theme
      els[1].addEventListener('click', function(e){
        This.setTheme('main-t-dark');
        This.Settings.currentTheme = 'dark';

        This.updateSettings( This.Settings, function(){
          console.log("\nSuccessfully set theme to Dark Theme!");
          This.showSaveSettings();
        });
      });

    }
  };
},