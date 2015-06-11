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
