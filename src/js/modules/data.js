/*||
||||   Module::Data
||||
||||   Gets and sets data in chrome storage, other stuff.
*/

var $   = require('./utils.js')(),
    DOM = require('./dom.js');//  Don't instantiate yet


var Data = function( UsedImages, elements ){

    return {
      fetch: function( cb, url, fetchRound ){
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
      parse: function( newData, fetchRound ){

        var topImg = this.returnTopImage( newData );

        if( !topImg.error ){
          //  removes the item before setting it again
          this.storage.remove();
          this.storage.set( topImg );

          //  store that as a new image
          UsedImages.add({
            id: topImg.id,
            redditLink: topImg.redditLink,
            url: topImg.url,
            time: Date.now()/1000
          }, function(){
            console.log("Successfully added newly used image!");
          });

          //  instantiate the DOM module with our data
          DOM( topImg ).setAll( elements );

        }else {
          console.info("Fetching new batch of images!");
          //  increment the fetchRound
          fetchRound = !fetchRound ? 1 : fetchRound + 1;
          var n     = topImg.name,
              s     = topImg.subreddit,
              count = 25 * fetchRound;
          //  Do our other fetch
          this.fetch( this.parse, "http://www.reddit.com/r/"+s+"/.json?count="+count+"&after="+n, fetchRound  );
        }

      },
      storage: {
        remove: function(){
          chrome.storage.local.remove( "lastImage", function(){
            console.log("Successfully removed lastImage from localStorage!");
          });
        },
        set: function( image ){
          chrome.storage.local.set({'lastImage': image}, function(){
            console.log("Successfully added lastImage to localStorage!");
            $.convertImgToBase64URL( image.url, function(base64data){
              this.setBase64(image,  base64data);
            }.bind(this));
          }.bind(this));
        },
        setBase64: function( d, n64 ){
          var o = d;
              o.base64Img = n64;
          chrome.storage.local.set({'oldData': o}, function(){
            console.log('Saved base64 image to localStorage!');
          });
        }
      },

      returnTopImage: function( data ){
        var obj = {},
          isImageFound = false;

        data.forEach( function( val, i ){
          /***
            *   For each item in the dataset passed in, we are going
            *   to make sure the following conditions are true:
            *
            *     1) the image hasn't been found yet
            *     2) it's not something dumb like a mod post
            *     3) it's from a trusted domain (right now just i.imgur stuff)
            *     4) it's not an image that's already been used
            *
            **/
          if( !isImageFound && this.isValidPost(val.data) && this.isValidDomain(val.data.domain && !this.isUsedImage(val.data) ) ){
            obj = {
              author:     val.data.author,              //  {string}  the reddit user
              bgUrl:      val.data.url,                 //  {string}  will take the place of data.url
              created:    val.data.created_utc,         //  {number}  a timestamp of when this post was created.
              domain:     val.data.domain,              //  {string}  a string of the domain of the post
              id:         val.data.id,                  //  {string}  a unique string that will be used to test if this image has been used yet or not
              name:       val.data.name,                //  {string}  an also unique string that will be used to build our url when fetching more results
              redditLink: 'http://www.reddit.com'+val.data.permalink, //  {string}  link to the reddit post
              title:      this.stripSquareBrackets(val.data.title),   //  {string}  a sanitized string, title of the post
              score:      val.data.score,               //  {number}  a timestamp of when this post was created
              subreddit:  val.data.subreddit,           //  {string}  the subreddit this came from
              url:        val.data.url,                 //  {string}  the url of the image (not the reddit link)
              timeSaved:  Date.now() / 1000             //  {number}  a timestamp of when this data was stored. divided by 1000 so we get the value in seconds
            };
            isImageFound = true;
          }
          if( !obj.url && i === (data.length - 1) ){
            obj.error = true;
            obj.name = val.data.name;
            obj.subreddit = val.data.subreddit;
          }

        }.bind(this));

        return obj;

      },
      isValidPost: function( post ){
        return post.domain === 'self.EarthPorn' || post.author === 'AutoModerator' || post.distinguished === 'moderator' ? false : true;
      },
      isValidDomain: function( domain ){
        //  TODO: this should actually do some domain filtering
        return domain === "i.imgur.com";
      },
      isUsedImage: function( image ){
        var used = false;
        if( !UsedImages.images )
          throw "Where the fuck are my UsedImages!!!"
        if( UsedImages.images.length <= 0 )
          return used;

        //  if we haven't exited the fn early, actually check if it's been used
        UsedImages.images.forEach( function(val){
          if( val.id === image.id )
            used = true;
        });

        return used;
      },
      /**   @name:   stripSquareBrackets
        *   @params: title [string]
        *   @desc:   recursively parses the title to remove stupid [stuff][in][square][brackets]
        *            CAVEAT: only if it's at the end of the string... could have adverse effects - fine for now
        */
      stripSquareBrackets: function( title ){
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
      }


    }
};


module.exports = Data;