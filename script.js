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
    /**   @name:   getImgurId
      *   @params: imgurUrl [string]
      *   @desc:   returns the id when given an imgur URL
      */
    getImgurId = function( imgurUrl ){
      return imgurUrl.substr(d.url.lastIndexOf('/') + 1);
    },
    /**   @name:   getLocalStorageData
      *   @params:
      *   @desc:
      */
    getLocalStorageData = function( cb ){

      //  You should just use chrome.storage.local

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


    },
    /**   @name:   getDataForFirstImage
      *   @params: d [object]
      *   @desc:   sifts through the provided data object for the first
      *            non-moderator post.
      *            returns an object with the important data from that
      */
    getDataForFirstImage = function( d ){

      if(!d && typeof d === 'object' ){
        throw "You didn't provide valid data to getDataForFirstImage()!";
      }

      var obj = {},
          isImageFound = false;

      d.forEach(function(val, i){
        if(isValidImagePost(val.data) && !isImageFound){

          obj.title    = val.data.title;
          obj.url      = val.data.url;
          isImageFound = true;

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
    /**   @name:   setBackgroundImage
      *   @params: el [string, selector], bgUrl [string]
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
        console.log("Setting title to: "+title);
        var element = document.querySelector(el);
        element.innerHTML = title;
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
    };








///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//////////////////////////////////start////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

document.addEventListener("DOMContentLoaded", function(event) {

  var rawRedditData = getLocalStorageData();

  if( !rawRedditData ){
    //  The main fetching thread
    fetchRedditData(function(newData){


      var data = getDataForFirstImage(newData);

      console.log( stripSquareBrackets(data.title) );

      /**    setTitle takes the element that gets appended,
        *    as well as the bracket-stripped title from the data.
        */
      setTitle('.pic-info-text', stripSquareBrackets(data.title));




    });
  }else{


    // setTitle('.pic-info-text', stripSquareBrackets(data.title));
    //
  }

});