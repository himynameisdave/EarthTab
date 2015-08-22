/*||
||||   Module::DOM
||||
||||   Used to set items in the DOM
*/

var $ = require('./utils.js')();


var DOM = function( data ){
  /**   @name:   setInnerHtml
    *   @params: el[string, selector], title[string]
    *   @desc:   takes a selector string and a title and appends that element with the specified content
    */
  var setInnerHtml = function( el, text ){
    var element = document.querySelector(el);
    element.innerHTML = text;
  },
  setLink = function( el, link ){
    var element = document.querySelector(el);
    element.href = link;
  };

  return {
    set: {
      author:          function( el ){
        setInnerHtml( el, data.author );
      },
      backgroundImage: function( el ){
        var element = document.querySelector(el);

        if( !data.base64Img && !data.bgUrl && !data.url )
          throw "Trying to set background, however could not find a base64Img or bgUrl or url in the data set!";

        if(data.base64Img){
          document.styleSheets[0].addRule( el, "background-image: url("+data.base64Img+")" );
          //  wait 200ms so the bg image can load (?)
          setTimeout(function(){
            $.addClass( '.main', 'main-visible' );
          }, 200);
        }else{
          element.style.backgroundImage = "url("+data.bgUrl+")";
          //  wait 200ms so the bg image can load (?)
          setTimeout(function(){
            $.addClass( '.main', 'main-visible' );
          }, 200);
        }
      },
      userLink:        function( el ){
        setLink( el, 'http://www.reddit.com/user/'+data.author+'/' );
      },
      redditLink:      function( el ){
        setLink( els, data.redditLink );
      },
      subreddit:       function( el ){
        setInnerHtml(el, data.subreddit);
        setLink(el, "http://www.reddit.com/r/"+data.subreddit);
      },
      title:           function( el ){
        setInnerHtml( el, data.title );
      },
      timePosted:      function( el ){
        var element = document.querySelector(el),
            now     = Date.now()/1000,
            posted  = data.created;

        setInnerHtml( el, $.truncatePostTime($.getHrsDiff( posted, now )) + " ago" );
      }
    },
    setAll: function( elements ){
      this.set.author( elements.author );
      this.set.backgroundImage( elements.backgroundImage );
      this.set.userLink( elements.userLink );
      this.set.redditLink( elements.redditLink );
      this.set.subreddit( elements.subreddit );
      this.set.title( elements.title );
      this.set.timePosted( elements.timePosted );
    }
  }
};



module.exports = DOM;
