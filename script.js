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
      */
    var fetchRedditData = function( cb ){
        var r = new XMLHttpRequest();
        r.open("get", "http://www.reddit.com/r/earthporn/.json", true);
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
      setLocalStorageData( data );
      setStuff(settings( data ));

    },
    setStuff = function( $ ){

      $.setTitle('.pic-info-text');
      $.setLink('.pic-info-text');

      /**    SHOULD BE IN A filterDomain function
        */
      switch($.data.domain){

        case 'i.imgur.com':
          $.setBackgroundImage( '.main' );
          break;

        case 'imgur.com':
          console.log('imgur.com Domain!!!');
          break;

        default:
          $.setBackgroundImage( '.main' );
      }

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
        setLink: function( el ){
          var element = document.querySelector(el);
          element.href = this.data.redditLink;
        },
        /**   @name:   settings.setBackgroundImage
          *   @params: el [string, selector]
          *   @desc:   provide a selector and a bg url and
          *            this function will go set that elements BG image to that URL
          */
        setBackgroundImage: function( el ){
          var element = document.querySelector(el);
          element.style.backgroundImage = "url("+this.data.bgUrl+")";
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
    /**   @name:   isLongerThanHrs
      *   @params: then [number, date], maxHrs [number]
      *   @desc:   takes the old time and the max # of hours
      *            returns true if the difference between then and now is > mxhrs
      */
    isLongerThanHrs = function( then, maxHrs ){

      var now  = Date.now(),
          diff = now - then,
          hrsSince = ((diff/1000)/60)/60;

          console.log( 'The time difference is: '+ ((diff/1000)/60)/60 + ' hours');

          if( hrsSince > maxHrs ){
            return true;
          }else{
            return false;
          }

    },
    /**   @name:   setLocalStorageData
      *   @params: d [object]
      *   @desc:   sets the data into localstorage under the oldData namespace
      */
    setLocalStorageData = function( d ){

      chrome.storage.local.set({'oldData': d}, function(){
        console.log('Saved settings to localStorage!');
      });

    },
    /**   @name:   getDataForTopImage
      *   @params: d [object]
      *   @desc:   sifts through the provided data object for the first non-moderator post.
      *            returns an object with the important data from that
      */
    getDataForTopImage = function( d ){

      if(!d && typeof d === 'object' ){
        throw "You didn't provide valid data to getDataForTopImage()!";
      }

      var obj = {},
          isImageFound = false;

      d.forEach(function(val, i){
        /**   If it's not a mod post & we haven't found our image yet
          */
        if(isValidImagePost(val.data) && !isImageFound){
          /**   Top Image object
            *   This is where all the data used in the application is set.
            */
          obj = {
            author:     val.data.author,              //  {string}  the reddit user
            created:    val.data.created,             //  {number}  a timestamp of when this post was created
            domain:     val.data.domain,              //  {string}  a string of the domain of the post
            title:      stripSquareBrackets(val.data.title),        //  {string}  a sanitized string, title of the post
            redditLink: 'http://www.reddit.com'+val.data.permalink, //  {string}  link to the reddit post
            score:      val.data.score,               //  {number}  a timestamp of when this post was created
            url:        val.data.url,                 //  {string} DEPRECIATE: the url of the image (not the reddit link)
            bgUrl:      val.data.url,                 //  {string}  will take the place of data.url
            timeSaved:  Date.now()                    //  {number}  a timestamp of when this post was created
          };
          isImageFound   = true;
        }
      });

      return obj;
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
      *   @desc:    creates a base64 of an image based on a given URL
      *
      *   Mega props to this Stackoverflow post:
      *   http://stackoverflow.com/a/20285053/4060044
      *
      *   Usage:
      *   convertImgToBase64URL('http://i.imgur.com/MJ3Amtx.jpg', function(base64Img){
      *     console.log(base64Img);
      *   });
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
    };





///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//////////////////////////////////start////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function(event) {


  chrome.storage.local.get( 'oldData', function(d){

    if(d.oldData){
      var maxHrs = 0.5;

      /**   Eventually this should be:
        *     if < 0.5
        *     
        */


      if( isLongerThanHrs( d.oldData.timeSaved, maxHrs ) ){
        console.log('It\'s been longer than '+maxHrs+' hrs');
        console.log("=========================\nThis doesnt get called often, so go into the code and see where this is being fired from.\n========================");
        fetchRedditData(parseRedditData);
      }else{
        console.log('It\'s less than '+maxHrs+' hrs');
        setStuff(settings( d.oldData ));
      }
    }else{
      fetchRedditData(parseRedditData);
    }

  });

});