/*||
||||   Module::Data
||||
||||   Gets and sets data in chrome storage, other stuff.
*/


var Data = function(){

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
      },
      findTopImage: function(){
        



      }


    }
}:


module.exports = Data;
