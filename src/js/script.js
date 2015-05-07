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
      clearLocalStorage();//clear localstorage before we do a set
      setLocalStorageData( data );
      setStuff(settings( data ));//sets DOM elements

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

      //  TODO: would be better to return the settings function with this object passed to it
      return obj;
    },
    /**   @name:   setStuff
      *   @params: $[object, data]
      *   @desc:   setStuf
      *            TODO: setStuff could totally be a method on the settings object,
      *                  that way it could just use 'this.domain'
      */
    setStuff = function( $ ){

      console.log("setStuff called with this data:", $.data);

      $.setTitle('.js-title');
      $.setRedditLink( ['.js-score', '.js-time-posted' ]);
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
    /**   @name:   settings
      *   @params: data [object]
      *   @desc:   a function that returns an object that contains all of our info
      *            as well as methods that interact with that data + the DOM
      */
    settings = function( data ){

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
            element.style.backgroundImage = "url("+this.data.base64Img+")";
            console.log( "Using the base64!" );
            //TODO: add an async checker for if the bg image has been set
            addClass( '.main', 'main-visible' );
          }else{
            element.style.backgroundImage = "url("+this.data.bgUrl+")";
            console.log( "Using the img url!" );
            //TODO: add an async checker for if the bg image has been set
            addClass( '.main', 'main-visible' );
          }

        }
      };
      return o;
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
    /**   @name:   setLocalStorageData
      *   @params: d [object]
      *   @desc:   sets the data into localstorage under the oldData namespace
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
      *   @params:  el [string, selector]
      *   @desc:    sets up the click event listener on a given dom element
      */
    setupFlipEvent = function( el ){

      var element = document.querySelector(el);

      element.addEventListener( 'click', function(){
        if( element.classList.contains('i-container-s-closed') ){
          removeClass( el, 'i-container-s-closed' );
          addClass( el, 'i-container-s-open' );
        }
        else if( element.classList.contains('i-container-s-open') ){
          removeClass( el, 'i-container-s-open' );
          addClass( el, 'i-container-s-closed' );
        }else{
          throw "What the whaaaa? http://bit.ly/1IjwmfN";
        }
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
      var time = h+":"+m;

      if(oldTime !== time) {
        document.querySelector(el).innerHTML = time;
      }
      var timeout = setTimeout(function(){
        setClock(el, time);
      },5000);// five seconds is a lot but I'd rather that then taking the performance hit
    },
    /**   @name:    addClass
      *   @params:  el [string, selector], class [string]
      *   @desc:    simplifies adding a class to an element
      */
    addClass = function( el, className ){
      var element = document.querySelector( el );
      element.classList.add(className);
    },
    /**   @name:    removeClass
      *   @params:  el [string, selector], class [string]
      *   @desc:    simplifies removing a class from an element
      */
    removeClass = function( el, className ){
      var element = document.querySelector( el );
      element.classList.remove(className);
    };







///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//////////////////////////////////start////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function(event) {

  //  Sets the clock
  setClock('.js-time');

  //  Sets up the click event on the flip container
  setupFlipEvent('.js-flip-container');

  //  Fetch oldData. Async.
  chrome.storage.local.get( 'oldData', function(d){

    //  check if there is any data
    if(d.oldData){
      //  Set maxHrs allowed before fetching clean data
      var maxHrs = 1;

      if( isLongerThanHrs( d.oldData.timeSaved, maxHrs ) ){
        console.log("It's been longer than "+maxHrs+" hr(s)\nFetching new data!");
        fetchRedditData(parseRedditData, "earthporn");
      }else{
        console.log("It's been less than "+maxHrs+" hr(s)\nUsing old data!");
        //  in case we weren't able to save the base64, let's get that whole process started
        if( !d.oldData.base64Img ){
          convertImgToBase64URL( d.oldData.url, function(base64data){
            saveBase64ToLocalStorage( d.oldData,  base64data );
          });
        }
        setStuff(settings( d.oldData ));
      }

    }else{
      fetchRedditData(parseRedditData, "earthporn");
    }

  });

});