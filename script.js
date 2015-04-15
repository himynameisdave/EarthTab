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

      chrome.storage.local.get( 'oldData', function(oldData){
        console.log(oldData);

        if( isMoreThanSixHrsOld( oldData.timeSaved ) ){

        }

      });
      return null;

    },
    /**   @name:   isMoreThanSixHrsOld
      *   @params: date [number, date]
      *   @desc:   returns whether the date passed to it is more than six hours ago
      */
    isMoreThanSixHrsOld = function( date ){
      var now = Date.now();
      console.log( date );
      // Date.parse(  )
      return true;
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
      *   @desc:   sifts through the provided data object for the first
      *            non-moderator post.
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
            url:        val.data.url,                 //  {string}  the url of the image (not the reddit link)
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
    /**   @name:   setBackgroundImage
      *   @params: el [string, selector], bgUrl [string]
      *   @desc:   provide a selector and a bg url and
      *            this function will go set that elements BG image to that URL
      */
    setBackgroundImage = function( el, bgUrl ){
      var element = document.querySelector(el);
      element.style.backgroundImage = "url("+bgUrl+")";
    },
    /**   @name:   setTitle
      *   @params: el[string, selector], title[string]
      *   @desc:   takes a selector string and a title and appends that element with the specified content
      */
    setTitle = function( el, title ){
      var element = document.querySelector(el);
      element.innerHTML = title;
    },
    /**   @name:   setLink
      *   @params: el[string, selector], title[string]
      *   @desc:   takes a selector string and a reddit link and appends that element with the specified content
      */
    setLink = function(el, link){
      var element = document.querySelector(el);
      element.href = link;
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

  var rawRedditData = getLocalStorageData();

  if( !rawRedditData ){
    //  The main fetching thread
    //  TODO: make this callback a named function so it can be reused.
    fetchRedditData(function(newData){

      /**    getDataForTopImage takes the element that gets appended,
        *    as well as the bracket-stripped title from the data.
        */
      var data = getDataForTopImage(newData);

      /**    setTitle takes the element that gets appended,
        *    as well as the bracket-stripped title from the data.
        *     TODO: these set commands are ripe to become a ninja function
        */
      setTitle('.pic-info-text', data.title);
      setLink('.pic-info-text', data.redditLink);


      setLocalStorageData( data );


      switch(data.domain){

        case 'i.imgur.com':
          setBackgroundImage( '.main', data.url );
          break;

        case 'imgur.com':
          // console.log('imgur.com');
          break;

        default:
          setBackgroundImage( '.main', data.url );
      }



      // convertImgToBase64URL('http://i.imgur.com/MJ3Amtx.jpg', function(base64Img){
      //   console.log(base64Img);
      // });

    });
  }else{


    // setTitle('.pic-info-text', data.title);
    //
  }

});