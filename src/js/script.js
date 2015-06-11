/**
  *          EarthTab Chrome Extension
  *
  *
  *     EarthTab pulls images from Reddit's SFW
  *     nature porn to transform your new tabs into
  *     beautiful windows into Earth's natural beauty.
  *
  *     Built by Dave Lunny in the beautiful year 2015.
  *     http://himynameisdave.com
  *
  *     Licensed under the MIT licence.
  *
  *     For more information, or to file an issue, please visit:
  *     https://github.com/himynameisdave/EarthTab
  *
  *
  */



    /**   @name:   fetchRedditData
      *   @params: cb [function], url[string], fetchRound[number]
      *   @desc:   goes and grabs the reddit stuff.
      *            Accepts a callback to handle the data
      *            TODO: check that this is genric enough to handle any reddit api request
      *                  I think most things coming from reddit in this format follow the data.children thing
      */
    var fetchRedditData = function( cb, url, fetchRound ){
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
    /**   @name:   parseRedditData
      *   @params: newData [object], fetchRound[number]
      *   @desc:   the callback function for the fetchRedditData above
                   fetchRound is the round of fetching we are on (count=25?)
      */
    parseRedditData = function( newData, fetchRound ){
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
    },
    /**   @name:   loopThruRedditDataForTopImg
      *   @params: redditData[object]
      *   @desc:   handles the loop through stuff that
      */
    loopThruRedditDataForTopImg = function( redditData, cb ){

      var obj = {},
          isImageFound = false;

      redditData.forEach(function(val, i){
        // If it's not a mod post & we haven't found our image yet
        if(isValidImagePost(val.data) && !isImageFound){
          // if( filterDomain(val.data.domain) && !isUsedImage(val.data.id, usedImages) ){
          if( filterDomain(val.data.domain) && !isUsedImage(val.data) ){
            /**   Top Image object
              *   This is where all the data used in the application is set.
              */
            obj = {
              author:     val.data.author,              //  {string}  the reddit user
              bgUrl:      val.data.url,                 //  {string}  will take the place of data.url
              created:    val.data.created_utc,         //  {number}  a timestamp of when this post was created.
              domain:     val.data.domain,              //  {string}  a string of the domain of the post
              id:         val.data.id,                  //  {string}  a unique string that will be used to test if this image has been used yet or not
              name:       val.data.name,                //  {string}  an also unique string that will be used to build our url when fetching more results
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
        if( !obj.url && i === (redditData.length - 1) ){
          obj.error = true;
          obj.name = val.data.name;
          obj.subreddit = val.data.subreddit;
        }
      });

      cb( obj );

    },
    /**   @name:   isUsedImage
      *   @params: currentImage[object], imgs[array]
      *   @desc:   does the actual looping through the old images and determines if the passed curentImage is used or not
      */
    isUsedImage = function( currentImage ){
      var imageBeenUsed = false;

      if( !$ettings.Settings.usedImages )
        throw "Trying to test if it's a used image, but couldn't find the list of usedImages";
      if( $ettings.Settings.usedImages.length <= 0 )
        return imageBeenUsed; // early return if there are no used images

      $ettings.Settings.usedImages.forEach(function( val ){
        if( val.id === currentImage.id ){
          console.warn("Found an image that has been used before!");
          imageBeenUsed = true;
        }
      });

      return imageBeenUsed;
    },
    /**   @name:   setStuff
      *   @params: $[object, data]
      *   @desc:   setStuf
      *            TODO: setStuff could totally be a method on the GetData object,
      *                  that way it could just use 'this.domain'
      */
    setStuff = function( $ ){

      if( !$.data.url )
        throw "Could not find any data passed to setStuff";

      console.log("setStuff called with this data:", $.data);

      $.setTitle('.js-title');
      // $.setRedditLink( ['.js-score', '.js-time-posted' ]);
      $.setRedditLink( '.js-time-posted' );
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
    /**   @name:   longerThanMins
      *   @params: then [number, timestamp], maxMins [number]
      *   @desc:   returns true if more mins have passed since 'then' than specified by 'maxMins'
      */
    longerThanMins = function( then, maxMins ) {
      //  difference is then vs now in miliseconds, then divided into 60 for minutes
      var diff = ((Date.now() / 1000) - then)/60;
      return diff > maxMins ? true : false;
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
    /**   @name:   saveNewImageInfo
      *   @params: d [object]
      *   @desc:   stores the "oldData" in localStorage AND stores the ID in the "usedItems"
      */
    saveNewImageInfo = function( d ){
      //  goes off to store that reddit data in localStorage
      saveRedditDataToLocalStorage( d );

      var newlyUsedImage = {
        id: d.id,
        redditLink: d.redditLink,
        url: d.url,
        time: Date.now()/1000
      };

      if( $ettings.Settings ){
        //  add a newlyUsedImage to the list of usedImages
        $ettings.Settings.usedImages.push(newlyUsedImage);
        $ettings.updateSettings($ettings.Settings, function(){
          console.info("We were able to save the settings with the newlyUsedImage:", $ettings);
        });
      }else{
        throw "$ettings doesnt exist - please use promises so this shit literally never happens...";
      }

    },
    /**   @name:   saveRedditDataToLocalStorage
      *   @params: d [object]
      *   @desc:   sets the data into localstorage under the oldData namespace
      *             TODO: this name is too generic!
      */
    saveRedditDataToLocalStorage = function( d ){
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
        el.style.display = 'block';
        setTimeout(function(){
          removeClass( el, hidden );
          addClass( el, visible );
        }, 50);
      }

    },
    /**   @name:    forceBGRefresh
      *   @params:  [none]
      *   @desc:    function called when a user wants to force reload the bg image
      *             It picks up from the same place as "this data is too old, lets get new data"
      */
    forceBGRefresh = function(){
      //  remove visible class from main
      removeClass( '.main', 'main-visible' );
      //  programatically click the settings to close it
      //  TODO: not an ideal solution
      var set = document.querySelector('.js-settings-controller');
      set.click.apply(set);

      //  no need to check if $ettings exists cause it has to by now
      var randomSub = ($ettings.gimmieARandomActiveSub()).toLowerCase();
      //  go fetch some data from that subreddit


      fetchRedditData(parseRedditData, "http://www.reddit.com/r/"+randomSub+"/.json");
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
    /**   @name:    truncatePostTime
      *   @params:  hrs [number]
      *   @desc:    takes the number of hours since the thing was posted and spits out something more readable (days/weeks/etc)
      */
    truncatePostTime = function( hrs ){
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

          this.setInnerHtml( el, truncatePostTime(getHrsDiff( posted, now )) + " ago" );
    },
    /**   @name:   settings.setBackgroundImage
      *   @params: el [string, selector]
      *   @desc:   provide a selector and a bg url and
      *            this function will go set that elements BG image to that URL
      */
    setBackgroundImage: function( el ){
      var element = document.querySelector(el);

      if( !this.data.base64Img && !this.data.bgUrl && !this.data.url )
        throw "Trying to set background, however could not find a base64Img or bgUrl or url in the data set!";

      if(this.data.base64Img){
        document.styleSheets[0].addRule( el, "background-image: url("+this.data.base64Img+")" );
        //  wait 200ms so the bg image can load (?)
        setTimeout(function(){
          addClass( '.main', 'main-visible' );
        }, 200);
      }else{
        element.style.backgroundImage = "url("+this.data.bgUrl+")";
        //  wait 200ms so the bg image can load (?)
        setTimeout(function(){
          addClass( '.main', 'main-visible' );
        }, 200);
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

//  Global Settings Object
var $ettings;

document.addEventListener("DOMContentLoaded", function(event) {

  //  get the whole $ettings ball rolling
  $ettings = GetSettings();
  $ettings.init();

  //  Fetch oldData. Async.
  //  TODO: This should all just be an init() fn like settings above.
  chrome.storage.local.get( 'oldData', function(d){
    var randomSub, maxMins, interval;
    //  check if there is any data
    //  FIX for #25 - data was found kinda, but no actual url to use
    if(d.oldData && d.oldData.url){
      //  As of v0.4.0 frequency can no longer be set/is overridden here
      maxMins = 5;
      //  check if it's been longer than 5 mins
      if( longerThanMins( d.oldData.timeSaved, maxMins ) ){
        console.log("It's been longer than "+maxMins+" mins!\nFetching new data!");
        //  grab us a random sub, chosen from the currently selected subs
        if($ettings.finishedInit){
          randomSub = ($ettings.gimmieARandomActiveSub()).toLowerCase();
        }else{
          interval = setInterval(function(){
            if($ettings.finishedInit){
              randomSub = ($ettings.gimmieARandomActiveSub()).toLowerCase();
              clearInterval(interval);
            }
          }, 100);
        }
        //  go fetch some data from that subreddit
        fetchRedditData(parseRedditData, "http://www.reddit.com/r/"+randomSub+"/.json");
      }else{
        console.log("It's been less than "+maxMins+" mins!\nUsing old data!");
        //  in case we weren't able to save the base64 last time, let's get that whole process started
        if( !d.oldData.base64Img ){
          //  this function is an async function that converts an image url into a base64 image
          convertImgToBase64URL( d.oldData.url, function(base64data){
            //  saveBase64ToLocalStorage stores our image to the oldData, which is why we need to pass a copy of the old stuff back
            saveBase64ToLocalStorage( d.oldData,  base64data );
          });
        }
        //  go and set the styles and stuffs, using this old data
        setStuff(GetData( d.oldData ));
      }

    }// else, if there is no oldData in
    else{
      if($ettings.finishedInit){
        randomSub = $ettings.gimmieARandomActiveSub().toLowerCase();
        fetchRedditData(parseRedditData, "http://www.reddit.com/r/"+randomSub+"/.json");
      }else{
        interval = setInterval(function(){
          if($ettings.finishedInit){
            randomSub = $ettings.gimmieARandomActiveSub().toLowerCase();
            fetchRedditData(parseRedditData, "http://www.reddit.com/r/"+randomSub+"/.json");
            clearInterval(interval);
          }
        }, 100);
      }

    }

  });

  //    DOM Setting Shit
  //    MOVED down here as that chrome.storage mafack should be async
  //  Sets the clock
  setClock('.js-time');

  //  sets up the flip event on the main circle
  setupFlipEvent({  el:       'js-flip-container',
                    targetEl: 'js-flip-container',
                    open:     'i-container-s-open',
                    close:    'i-container-s-closed'
                  });

  //  setup the thing to open settings
  setupToggleSettingsEvent({
    settings: document.querySelector('.settings'),
    openSettings: document.querySelector('.js-settings-controller')
  });

  // setup force refresh click event
  document.querySelector('.js-force-refresh').onclick = forceBGRefresh;

});
