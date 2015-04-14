/**
  *         EarthTab Chrome Extension
  *
  *   Scrapes /r/earthporn and makes the top image
  *       your new tab background image
  */


/**
  *     Snoocore is a simple reddit API wrapper we're using here
  *     TODO: weigh the pros and cons of using this, as it's great
  *           for OAuth stuff but is burdenous for this task maybe
  */
var Snoocore  = require('snoocore'),
    Reddit    = new Snoocore({
                  userAgent: "chrome-extension:EarthTab:0.0.1 /u/himynameisdave9"
                }),

    /**   @name:   fetchRedditData
      *   @params: cb[function]
      *   @desc:   goes and grabs the reddit stuff.
      *            Accepts a callback to handle the data
      */
    fetchRedditData = function( cb ){

      Reddit('/r/earthporn/.json').get()
        .then(function(result) {
          cb(result.data.children);
        }).done();

    },
    /**   @name:   getImgurId
      *   @params: imgurUrl[string]
      *   @desc:   returns the id when given an imgur URL
      */
    getImgurId = function( imgurUrl ){
      return imgurUrl.substr(d.url.lastIndexOf('/') + 1);
    },
    /**   @name:   checkInLocalStorage
      *   @params: {none}
      *   @desc:   checks 
      */
    getLocalStorageData = function( cb ){

      if(chrome.storage.sync){
        // chrome.storage.sync


        return null;

      }else if(chrome.storage.local){



        return null;

      }else{
        return null;
      }

    },
    setLocalStorageData = function( d ){



      console.log('Setting new data!');



    },
    /**   @name:   parseDataForFirstImage
      *   @params: d[object]
      *   @desc:   sifts through the provided data object for the first
      *            non-moderator post.
      *            returns an object with the important data from that
      */
    parseDataForFirstImage = function( d ){

      if(!d && typeof d === 'object' ){
        throw "You didn't provide valid data to parseDataForFirstImage()!";
      }


      var obj = {};

      d.forEach(function(val, i){

        if(isValidImagePost(val.data)){


        }



      });



      return obj;

    },
    /**   @name:   isValidImagePost
      *   @params: post[object]
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
    /**   @name:   setBackgroundImage
      *   @params: el[string, selector], bgUrl[string]
      *   @desc:   provide a selector and a bg url and
      *            this function will go set that elements BG image to that URL
      */
    setBackgroundImage = function( el, bgUrl ){
      document.addEventListener("DOMContentLoaded", function(event) {
        var element = document.querySelector(el);
        element.style.backgroundImage = "url("+bgURL+")";
      });
    },
    /**   @name:   setTitle
      *   @params: el[string, selector], title[string]
      *   @desc:   takes a selector string and a title and appends that element with the specified content
      */
    setTitle = function( el, title ){
      document.addEventListener("DOMContentLoaded", function(event) {
        var element = document.querySelector(el);
        element.innerHTML = title;
      });
    };








///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//////////////////////////////////start////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////


  var rawRedditData = getLocalStorageData();

  if( rawRedditData === null ){
    //  The main fetching thread
    fetchRedditData(function(newData){

      var data = parseDataForFirstImage(newData);
      setLocalStorageData( data );

      // goDoOtherStuff();

    });
  }else{
    // goDoOtherStuff();
  }


});
