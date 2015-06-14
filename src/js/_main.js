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
          fetchRedditData( parseRedditData, generateRedditUrl( s, count, n ), fetchRound );
        }else{
          //  Eventually, after finding a valid image, this runs.
          //clear localstorage before we do a set
          setNewImage( newImage );
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
              isFav:      false,                        //  {boolean} sets wether or not this is a fav'd image or not
              name:       val.data.name,                //  {string}  an also unique string that will be used to build our url when fetching more results
              redditLink: 'http://www.reddit.com'+val.data.permalink, //  {string}  link to the reddit post
              title:      val.data.title.replace(/\[.*?\]/g, ''),     //  {string}  a sanitized string, title of the post (strips out "[ ]" shit).
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

    /**   @name:   setNewImage
      *   @params: newImage[]
      *   @desc:   handles the actual setting of a new image
      */
    setNewImage = function( newImage ){
      removeItemFromLocalStorage('oldData');
      saveNewImageInfo( newImage );
      setStuff(GetData( newImage ));//sets DOM elements
      setupFavClickEvent( '.js-fav-button', newImage );
    },
    /**   @name:   generateRedditUrl
      *   @params: sub[string], count[number/string], after[string]
      *   @desc:   spits out a reddit json API url based on params given
      */
    generateRedditUrl = function( sub, count, after ){
      if(!count || !after)
        return "http://www.reddit.com/r/"+sub+"/.json";

      if( count && after )
        return "http://www.reddit.com/r/"+sub+"/.json?count="+count+"&after="+after;
      else
        throw "Must pass both count and after if you're trying to generate that kind of URL.";
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
        console.log('Saved redditData to localStorage!');
        if( !d.base64Img ){
          convertImgToBase64URL( d.url, function(base64data){
            saveBase64ToLocalStorage( d,  base64data );
          });
        }
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
      return post.domain === 'self.EarthPorn' || post.author === 'AutoModerator' || post.distinguished === 'moderator' ? false : true;
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



    setupFavClickEvent = function( el, currentImage ){
      var element = resolveElement(el);

      console.log( "Here's currentImage:" );
      console.log(currentImage);

      //  first thing to do is apply the "fav" class if this is a fav image
      if( currentImage.isFav ){
        setFavIconToActive( element );
      }else{
        element.onclick = function(){
          if( !this.classList.contains( 'settings-action-button-fav-s-active' ) ){
            setFavIconToActive( element );
            currentImage.isFav = true;
            registerFav( currentImage );
          }
        };
      }
    },
    /**   @name:    setFavIconToActive
      *   @params:  el [object or string]
      *   @desc:    very simple addClasser for setting the fav icon to active
      */
    setFavIconToActive = function( el ){
      var element = resolveElement(el);
      if( !element.classList.contains( 'settings-action-button-fav-s-active' ) )
        addClass( element, 'settings-action-button-fav-s-active' );
    },
    /**   @name:    setFavIconToInactive
      *   @params:  el [object or string]
      *   @desc:    very simple removeClasser for setting the fav icon to active
      */
    setFavIconToInactive = function( el ){
      var element = resolveElement(el);
      if( element.classList.contains( 'settings-action-button-fav-s-active' ) )
        removeClass( element, 'settings-action-button-fav-s-active' );
    },
    /**   @name:    registerFav
      *   @params:  favedImg [object]
      *   @desc:    takes the newly fav'd object, adds it to the $ettings and then calls updateSettings
      */
    registerFav = function( favedImg ){
      $ettings.Settings.favImgs.push(favedImg);
      //  should work
      saveRedditDataToLocalStorage(favedImg);
      //  TODO: $ettings.updateSettings should default to the old $ettings.Settings object if nothing is passed in
      $ettings.updateSettings( $ettings.Settings, function(){
        console.log("Saved your favorite image!");
      } );

    },
    /**   @name:    gimmieARandomFavImage
      *   @params:  [none]
      *   @desc:    returns a random 
      */
    gimmieARandomFavImage = function(){
      var l = $ettings.Settings.favImgs.length,
          r = Math.floor( Math.random()*l );
      return $ettings.Settings.favImgs[ r ];
    },
    /**   @name:    isUsingFavOrOld
      *   @params:  favFreq [object]
      *   @desc:    isUsingFavOrOld determines if we use a new image or an old favorite
      *             favFreq is the 1:X ratio that dictates how often shit gets fired
      */
    isUsingFavOrOld = function( favFreq ){
      if(!favFreq || typeof favFreq !== "number" )
        throw "Please pass a valid favFreq to isUsingFavOrOld!";
      // first lets check if there are actually even any favs
      if( $ettings.Settings.favImgs.length <= 0 )
        return false;
      //  THIS GOVERNS WHAT DECIDES IF IT'S A FAV IMAGE THAT GETS USED OR NOT
      var r1 = Math.floor(Math.random()*favFreq)+1,
          r2 = Math.floor(Math.random()*favFreq)+1;
      //  essentially if both of our random numbers are the same then this passes
      if( r1 === r2 )
        return true;
      else
        return false;
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
      //  reset the class on the fav button/icon
      setFavIconToInactive( '.js-fav-button' );
      //  programatically click the settings to close it
      //  TODO: not an ideal solution
      var set = document.querySelector('.js-settings-controller');
      set.click.apply(set);

      //  go get a new background image
      if( isUsingFavOrOld(9) ){ // note that a slightly better odds are given when force refreshing cause it's nicer to the user
        console.warn("\nUSING AN OLD FAV!\n");
        setNewImage( gimmieARandomFavImage() );
      }
      else{
        //  no need to check if $ettings exists cause it has to by now
        var randomSub = ($ettings.gimmieARandomActiveSub()).toLowerCase();
        //  go fetch some data from that subreddit
        fetchRedditData(parseRedditData, generateRedditUrl( randomSub ));
      }
    },

    /**   @name:    clearUsedImages
      *   @params:  [none]
      *   @desc:    function that allows users to clear the cache of used images
      */
    clearUsedImages = function(){
      $ettings.Settings.usedImages = [];
      $ettings.updateSettings( $ettings.Settings, function(){
        console.log("Sucessfully cleared the used image cache!");
        $ettings.showSaveSettings();
      });
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
            h = h === 0 ? 12 : h;
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
