/**
  *         EarthTab Chrome Extension
  *
  *   Scrapes /r/earthporn and makes the top image
  *       your new tab background image
  */


    /**   @name:   fetchRedditData
      *   @params: cb [function]
      *   @desc:   goes and grabs the reddit stuff.
      *            Accepts a callback to handle the data
      *            TODO: check that this is genric enough to handle any reddit api request
      *                  I think most things coming from reddit in this format follow the data.children thing
      */
    var fetchRedditData = function( cb, sub ){
        var r = new XMLHttpRequest();
        r.open("get", "http://www.reddit.com/r/"+sub+"/.json", true);
        r.onload = function(xmlEvent){
          cb(JSON.parse(r.response).data.children);
        };
        r.send();
    },
    /**   @name:   parseRedditData
      *   @params: newData [object]
      *   @desc:   the callback function for the fetchRedditData above
      */
    parseRedditData = function(newData){
      /**    getDataForTopImage takes the element that gets appended,
        *    as well as the bracket-stripped title from the data.
        */
      var data = getDataForTopImage(newData);
      /**    This will take the data we just grabbed and save it
        *    into localstorage for us
        */
      removeItemFromLocalStorage('oldData');//clear localstorage before we do a set
      setLocalStorageData( data );
      setStuff(GetData( data ));//sets DOM elements
    },
    /**   @name:   getDataForTopImage
      *   @params: d [object]
      *   @desc:   sifts through the provided data object for the first non-moderator post.
      *            returns an object with the important data from that
      */
    getDataForTopImage = function( d ){

      if(!d && typeof d === 'object' )
        throw "You didn't provide valid data to getDataForTopImage()!";

      var obj = {},
          isImageFound = false;

      d.forEach(function(val, i){
        /**   If it's not a mod post & we haven't found our image yet
          */
        if(isValidImagePost(val.data) && !isImageFound){
          //  TEMPORARY: just accepts i.imgur domains
          if( filterDomain(val.data.domain) ){

            console.log( val );
            /**   Top Image object
              *   This is where all the data used in the application is set.
              */
            obj = {
              author:     val.data.author,              //  {string}  the reddit user
              bgUrl:      val.data.url,                 //  {string}  will take the place of data.url
              created:    val.data.created_utc,         //  {number}  a timestamp of when this post was created.
              domain:     val.data.domain,              //  {string}  a string of the domain of the post
              redditLink: 'http://www.reddit.com'+val.data.permalink, //  {string}  link to the reddit post
              title:      stripSquareBrackets(val.data.title),        //  {string}  a sanitized string, title of the post
              score:      val.data.score,               //  {number}  a timestamp of when this post was created
              subreddit:  val.data.subreddit,           //  {string}  the subreddit this came from
              url:        val.data.url,                 //  {string}  the url of the image (not the reddit link)
              timeSaved:  Date.now() / 1000             //  {number}  a timestamp of when this data was stored. divided by 1000 so we get the value in seconds
            };
            isImageFound   = true;
          }
        }
      });

      //  TODO: would be better to return the GetData function with this object passed to it
      return obj;
    },
    /**   @name:   setStuff
      *   @params: $[object, data]
      *   @desc:   setStuf
      *            TODO: setStuff could totally be a method on the GetData object,
      *                  that way it could just use 'this.domain'
      */
    setStuff = function( $ ){

      console.log("setStuff called with this data:", $.data);

      $.setTitle('.js-title');
      $.setRedditLink( ['.js-score', '.js-time-posted' ]);
      $.setSubreddit('.js-subreddit');
      $.setUserLink('.js-username');
      $.setAuthor('.js-username');
      $.setTimePosted('.js-time-posted');
      $.setBackgroundImage( '.js-img' );

    },
    /**   @name:   filterDomain
      *   @params: domain [string]
      *   @desc:   Right now this just returs true if it's an 'i.imgur domain'
      *            What this will eventually do is get a proper URL from non-direct image links
      */
    filterDomain = function(domain){
      if( domain === "i.imgur.com" )
        return true;
      else
        return false;
    },
    /**   @name:   getImgurId
      *   @params: imgurUrl [string]
      *   @desc:   returns the id when given an imgur URL
      */
    getImgurId = function( imgurUrl ){
      return imgurUrl.substr(d.url.lastIndexOf('/') + 1);
    },
    /**   @name:   getHrsDiff
      *   @params: oldTime [number, timestamp], newTime [number, timestamp]
      *   @desc:   returns the number of hours between two given times, NOT ROUNDED
      */
    getHrsDiff = function( oldTime, newTime ){
      var diff = newTime - oldTime;
      return (diff/60)/60;
    },
    /**   @name:   isLongerThanHrs
      *   @params: then [number, date], maxHrs [number]
      *   @desc:   takes the old time and the max # of hours
      *            returns true if the difference between then and now is > mxhrs
      *            TODO: see if this function is actually needed - getHrsDiff() may actually be fine on it's own
      */
    isLongerThanHrs = function( then, maxHrs ){
      var hrsSince = getHrsDiff( then, (Date.now() / 1000) );
          console.log( 'The time difference is: '+ hrsSince + ' hours');

          if( hrsSince > maxHrs )
            return true;
          else
            return false;
    },
    /**   @name:   clearLocalStorage
      *   @params: {none}
      *   @desc:   simple utility to clear chrome.localstorage
      */
    clearLocalStorage = function(){

      chrome.storage.local.clear(function(){
        localStorage.clear();
        console.log('Cleared localStorage!');
      });
    },
    /**   @name:   removeItemFromLocalStorage
      *   @params: item[string]
      *   @desc:   removes a specific thing from localStorage
      */
    removeItemFromLocalStorage = function( item ){
      chrome.storage.local.remove( item, function(){
        console.log("Successfully removed "+item+" from localStorage!");
      });
    },
    /**   @name:   setLocalStorageData
      *   @params: d [object]
      *   @desc:   sets the data into localstorage under the oldData namespace
      *             TODO: this name is too generic!
      */
    setLocalStorageData = function( d ){

      chrome.storage.local.set({'oldData': d}, function(){
        console.log('Saved settings to localStorage!');
        convertImgToBase64URL( d.url, function(base64data){
          saveBase64ToLocalStorage( d,  base64data );
        });
      });

    },
    /**   @name:   saveBase64ToLocalStorage
      *   @params: d [object], n64 [string]
      *   @desc:   takes the old data object, appends the base64 to it, and adds it to localstorage
      */
    saveBase64ToLocalStorage = function( d, n64 ){
      var o = d;
          o.base64Img = n64;
      chrome.storage.local.set({'oldData': o}, function(){
        console.log('Saved base64 image to localStorage!');
      });

    },
    /**   @name:   isValidImagePost
      *   @params: post [object]
      *   @desc:   takes the passed in object and tests that it isn't a moderator
      *            or text post. Returns true if it passes these tests.
      */
    isValidImagePost = function( post ){
      if( post.domain === 'self.EarthPorn' || post.author === 'AutoModerator' || post.distinguished === 'moderator' ){
        return false;
      }else{
        return true;
      }
    },
    /**   @name:   stripSquareBrackets
      *   @params: title [string]
      *   @desc:   recursively parses the title to remove stupid [stuff][in][square][brackets]
      *            CAVEAT: only if it's at the end of the string... could have adverse effects - fine for now
      */
    stripSquareBrackets = function( title ){
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
    },
    /**   @name:    convertImgToBase64URL
      *   @params:  url [string], callback [function], outputFormat [string]
      *   @desc:    creates a base64 of an image based on a given URL. ASYNC
      *
      *   Mega props to this Stackoverflow post:
      *   http://stackoverflow.com/a/20285053/4060044
      */
    convertImgToBase64URL = function(url, callback, outputFormat){
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
    /**   @name:    setupFlipEvent
      *   @params:  clickEvent [object]
      *   @desc:    Passed a "click event" object which contains the classes/elements we need to target
      */
    setupFlipEvent = function( e ){
      var element = document.querySelector('.'+e.el);

      element.addEventListener( 'click', function(){
        if( element.classList.contains(e.close) ){
          removeClass( element, e.close );
          addClass( element, e.open );
        }
        else if( element.classList.contains(e.open) ){
          removeClass( element, e.open );
          addClass( element, e.close );
        }else{
          throw "What the whaaaa? http://bit.ly/1IjwmfN";
        }
       });

    },

    /**   @name:    setupToggleSettingsEvent
      *   @params:  els [object]
      *   @desc:    accepts an object of elements and goes and sets the toggle event
      */
    setupToggleSettingsEvent = function( els ){

      els.openSettings.addEventListener('click', function(){

        if( els.settings.classList.contains( 'settings-s-closed' ) ){
          removeClass( '.settings', 'settings-s-closed' );
          addClass( '.settings', 'settings-s-open' );
          removeClass( els.openSettings, 'settings-button-s-closed' );
          addClass( els.openSettings, 'settings-button-s-open' );
          toggleContainerVisibility('close');
        }
        else if( els.settings.classList.contains( 'settings-s-open' ) ){
          removeClass( '.settings', 'settings-s-open' );
          addClass( '.settings', 'settings-s-closed' );
          toggleContainerVisibility('open');
          removeClass( els.openSettings, 'settings-button-s-open' );
          addClass( els.openSettings, 'settings-button-s-closed' );
        }else{
          throw "What the whaaaa? http://bit.ly/1IjwmfN";
        }

      });

    },
    /**   @name:    toggleContainerVisibility
      *   @params:  clickEvent [object]
      *   @desc:    Passed a "click event" object which contains the classes/elements we need to target
      *             TODO: this whole thing seems pretty haxor/overkill
      */
    toggleContainerVisibility = function( toggle ){

      //  hella safeguarding
      if( typeof toggle !== 'string' )
        throw 'toggleContainerVisibility() needs a string yo!';
      if( toggle !== 'open' && toggle !== 'close' )
        throw "You gotta pass 'open' or 'close' to toggleContainerVisibility()";

      var el      = document.querySelector('.i-container'),
          visible = 'i-container-s-visible',
          hidden  = 'i-container-s-hidden';

      if( toggle === 'close' && el.classList.contains( visible ) ){
        removeClass( el, visible );
        addClass( el, hidden );
        setTimeout(function(){
          el.style.display = 'none';
        }, 500);//actual anim time is 0.45s in the Less file
      }
      if( toggle === 'open' && el.classList.contains( hidden ) ){
        console.log('closing the settings, opening the ');
        el.style.display = 'block';
        setTimeout(function(){
          removeClass( el, hidden );
          addClass( el, visible );
        }, 50);
      }

    },
    /**   @name:    setClock
      *   @params:  el [string, selector], oldTime [number, time; optional]
      *   @desc:    recursivly checks the time and alters it in the DOM
      *             essentially a self-contained worker function
      */
    setClock = function( el, oldTime ){
      var t = new Date(),
          h = t.getHours(),
          m = t.getMinutes();
          if (m<10) { m = "0"+m; }
          if( h > 12 ){
            h = h - 12;
          }
      var time = h+":"+m;

      if(oldTime !== time) {
        document.querySelector(el).innerHTML = time;
      }
      var timeout = setTimeout(function(){
        setClock(el, time);
      },5000);// five seconds is a lot but I'd rather that then taking the performance hit
    },
    /**   @name:    resolveElement
      *   @params:  el [string, selector OR DOM element object]
      *   @desc:    handy utility that returns the actual element, whether passed a selector string or actual element
      */
    resolveElement = function( el ){
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
    addClass = function( el, className ){
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
    removeClass = function( el, className ){
      var element;
      if( typeof el === 'object' )
        element = el;
      else if( typeof el === 'string' )
        element = document.querySelector( el );
      else
        throw "removeClass() needs either an element or a selector string!";
      element.classList.remove(className);
    },


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
              //  the real question is do you really need to pass stuff to parseSettings
              This.parseSettings();
              This.finishedInit = true;
            }else{
              console.log('Using new data for settings');
              var newSettings = This.buildDefaultSettings();
              This.updateSettings( newSettings, function(d){
                console.log('Updated the localStorage Settings!');
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
          *               2. inject the frequency range input
          */
        parseSettings: function(){

          //  setting the frequency initially, using whatever is in Settings as our value
          this.setFrequency( this.Settings.updateFrequency, '.js-settings-update-frequency' );
          this.injectSubs( '.js-settings-subs' );
          this.setupFrequencyChangeListener( '.js-settings-update-frequency' );
          this.setupCheckboxChangeListener();

        },
        /**   @name:    buildDefaultSettings
          *   @params:  [none]
          *   @desc:    builds out a default settings object
          */
        buildDefaultSettings: function(){
          var s = {
            updateFrequency: 8,
            subs: []
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
        /**   @name:    convertFrequencyToHrs
          *   @params:  frequency[number]
          *   @desc:    quickly converts our "base48" number to hrs string
          */
        convertFrequencyToHrs: function( frequency ){
          return frequency * 0.25;
        },
        /**   @name:    setFrequency
          *   @params:  frequency[number], els [selector, string], cb[callback function]
          *   @desc:    sets the update frequency meter based on the settings
          *             accepts a callback that will reset the "beingChanged" flag on the event listener
          */
        setFrequency: function( newFrequency, el, cb ){

      //  TODO: this was breaking shit. lets make sure our frequency is saved as a number
          // if( typeof newFrequency !== 'number' )
          //   throw "setFrequency requires a number be passed as the first parameter!";

          var element = resolveElement(el),
              //  TODO: this selector should be based of the element string passed in here...
              innerFrequencyEl = ".js-settings-update-frequency::-webkit-slider-thumb:before";

          //  actually setting the value of the range <input> element
          element.value = newFrequency;

          //  adds value to the css content element
          var val = this.convertFrequencyToHrs(newFrequency);
          document.styleSheets[1].addRule( innerFrequencyEl, "content: '"+val+"'" );

          //  if there is a callback we call it
          if( cb ){ cb(); }

        },
        /**   @name:    setupFrequencyChangeListener
          *   @params:  el[selector string]
          *   @desc:    sets the settings to "available"
          */
        setupFrequencyChangeListener: function( el ){

          var element = resolveElement(el),
              beingChanged = false,
              This = this;

          element.addEventListener('input', function(){
            var val = parseInt(element.value);
            if(!beingChanged){
              beingChanged = true;
              This.setFrequency( val, el, function(){
                beingChanged = false;
                /* Should the below stuff be in the callback also? */
              });

              //  update the global settings object
              This.Settings.updateFrequency = element.value;
              //  Show our save settings alert
              This.showSaveSettings();
              //  actually save da new settings
              This.updateSettings( This.Settings, function(){
                console.log("\nSuccessfully saved settings!");
                // console.log( This.Settings );
              });

            }
          });

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
        }
      };
    },









///
//      TODO: make the settings methods like the GetData one below
///////////////////
    /**   @name:   GetData
      *   @params: data [object]
      *   @desc:   a function that returns an object that contains all of our info
      *            as well as methods that interact with that data + the DOM
      *
      *            TODO:
      *            This is a ninja function, I wish the rest of the application was structured like this
      */
    GetData = function( data ){

      var o = {
        data: data,
        /**   @name:   setInnerHtml
          *   @params: el[string, selector], title[string]
          *   @desc:   takes a selector string and a title and appends that element with the specified content
          */
        setInnerHtml: function( el, text ){
          var element = document.querySelector(el);
          element.innerHTML = text;
        },
        /**   @name:   settings.setTitle
          *   @params: el[string, selector], title[string]
          *   @desc:   takes a selector string and a reddit link and appends that element with the specified content
          */
        setTitle: function( el ){
          this.setInnerHtml( el, this.data.title );
        },
        /**   @name:   settings.setLink
          *   @params: el[string, selector]
          *   @desc:   takes a selector string and a reddit link and appends that element with the specified content
          */
        setLink: function( el, link ){
          var element = document.querySelector(el);
          element.href = link;
        },
        /**   @name:   settings.setRedditLink
          *   @params: el[string OR array, selector(s)]
          *   @desc:   takes a selector string and a reddit link and appends that element with the specified content
          */
        setRedditLink: function( els ){
          if( typeof els === 'string' ){
            this.setLink( els, this.data.redditLink );
          }else if( typeof els.length !== "undefined" ){
            for(i=0; i < els.length; i++){ // can use a forEach because 'this' methods are not available to inner function
              this.setLink( els[i], this.data.redditLink );
            }
          }else{
            throw "An invalid 'els' paramater was passed to this.setRedditLink. Please pass it a selector string or an array of selector strings.";
          }
        },
        /**   @name:   setSubreddit
          *   @params: el[string, selector]
          *   @desc:   takes a selector string, adds the subreddit name and link to it
          */
        setSubreddit: function( el ){
          this.setInnerHtml(el, this.data.subreddit);
          this.setLink(el, "http://www.reddit.com/r/"+this.data.subreddit);
        },
        /**   @name:   settings.setAuthor
          *   @params: el[string, selector]
          *   @desc:   takes a selector string and a reddit author and appends that element with the specified content
          */
        setAuthor: function( el ){
          this.setInnerHtml( el, this.data.author );
        },
        /**   @name:   settings.setUserLink
          *   @params: el[string, selector]
          *   @desc:   takes a selector string and a reddit author and appends that element with the specified content
          */
        setUserLink: function( el ){
          this.setLink( el, 'http://www.reddit.com/user/'+this.data.author+'/' );
        },
        /**   @name:   settings.setTimePosted
          *   @params: el[string, selector]
          *   @desc:   takes a selector string and the time posted and appends that element with the specified content
          */
        setTimePosted: function( el ){
          var element = document.querySelector(el),
              now    = Date.now()/1000,
              posted = this.data.created;

              this.setInnerHtml( el, (Math.floor(getHrsDiff( posted, now )) + ' hours ago') );
        },
        /**   @name:   settings.setBackgroundImage
          *   @params: el [string, selector]
          *   @desc:   provide a selector and a bg url and
          *            this function will go set that elements BG image to that URL
          */
        setBackgroundImage: function( el ){
          var element = document.querySelector(el);

          if( !this.data.base64Img && !this.data.bgUrl )
            throw "Trying to set background, however could not find a base64Img or bgUrl in the data set!";

          if(this.data.base64Img){
            document.styleSheets[1].addRule( el, "background-image: url("+this.data.base64Img+")" );
            console.log( "Using the base64!" );
            addClass( '.main', 'main-visible' );
          }else{
            element.style.backgroundImage = "url("+this.data.bgUrl+")";
            console.log( "Using the img url!" );
            addClass( '.main', 'main-visible' );
          }

        }
      };
      return o;
    };







///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//////////////////////////////////start////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////


var $ettings;

document.addEventListener("DOMContentLoaded", function(event) {

  //  Sets the clock
  setClock('.js-time');

  //  get the whole $ettings ball rolling
  $ettings = GetSettings();
  $ettings.init();

  //  sets up the flip event on the main circle
  setupFlipEvent({  el:       'js-flip-container',
                    targetEl: 'js-flip-container',
                    open:     'i-container-s-open',
                    close:    'i-container-s-closed'
                  });

  //  els
  var els = {
    settings: document.querySelector('.settings'),
    openSettings: document.querySelector('.js-settings-controller')
  };

  //  setup the thing to open settings
  setupToggleSettingsEvent( els );

  //  Fetch oldData. Async.
  chrome.storage.local.get( 'oldData', function(d){
    var randomSub, maxHrs;
    //  check if there is any data
    if(d.oldData){

      if($ettings.Settings){
        // set our maxHrs;
        maxHrs = $ettings.Settings.updateFrequency * 0.25;
      }else{
        throw "$ettings.Settings was not available when we looked for it!";
      }

      if( isLongerThanHrs( d.oldData.timeSaved, maxHrs ) ){
        console.log("It's been longer than "+maxHrs+" hr(s)\nFetching new data!");
        randomSub = ($ettings.gimmieARandomActiveSub()).toLowerCase();
        fetchRedditData(parseRedditData, randomSub);
      }else{
        console.log("It's been less than "+maxHrs+" hr(s)\nUsing old data!");
        //  in case we weren't able to save the base64, let's get that whole process started
        if( !d.oldData.base64Img ){
          convertImgToBase64URL( d.oldData.url, function(base64data){
            saveBase64ToLocalStorage( d.oldData,  base64data );
          });
        }
        setStuff(GetData( d.oldData ));
      }

    }else{


      //  Need to check if $settings.Settings exist

      if($ettings.finishedInit){
        randomSub = $ettings.gimmieARandomActiveSub().toLowerCase();
        fetchRedditData(parseRedditData, randomSub);
      }else{
        var interval = setInterval(function(){
          if($ettings.finishedInit){
            randomSub = $ettings.gimmieARandomActiveSub().toLowerCase();
            fetchRedditData(parseRedditData, randomSub);
          }
          clearInterval(interval);
        }, 100);
      }

    }

  });
});
