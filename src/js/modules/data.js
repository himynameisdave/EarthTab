/*||
||||   Module::Data
||||
||||   Gets and sets data in chrome storage, other stuff.
*/


var Data = function( UsedImages ){

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

        /*
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
        */

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