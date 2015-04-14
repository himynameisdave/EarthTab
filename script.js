
document.addEventListener('DOMContentLoaded', function(){


  var request = new XMLHttpRequest(),
      url     = 'http://www.reddit.com/r/earthporn/.json',
      gotOurImage = false,
      topPic  = {};//needs a better name



      request.open( 'GET', url, true );
      request.onload = function(xmlEvent){
        processInfo(JSON.parse(request.response).data.children);
      };
      request.send();



    // Handles sifting the data and setting gotOurImage to true
    var processInfo = function(data){

      //  loop through posts
      data.forEach(function(val, i){
        var d = val.data;//simpifier
        //  if they aren't a mod cause mods such
        if( d.distinguished !== "moderator" ){
          //  check all data
          // console.log(d);
          if(!gotOurImage){
            if( d.domain === 'i.imgur.com' ){
              topPic.redditLink = d.permalink;
              topPic.domain = d.domain;
              topPic.title = d.title;
              topPic.url = d.url;
              gotOurImage = true;
            }
            else if( d.domain === 'imgur.com' ){
              topPic.redditLink = d.permalink;
              topPic.domain = d.domain;
              topPic.title = d.title;
              topPic.url = 'https://api.imgur.com/3/image/'+d.url.substr(d.url.lastIndexOf('/') + 1);
              gotOurImage = true;
            }
          }
        }
      });

      console.log( topPic );

      //  check the domain here too


      switch( topPic.domain ){
        case 'i.imgur.com':
          setTitle(topPic.title);
          setBG(topPic.url);
        break;
        case 'imgur.com':
          setTitle(topPic.title);
          
          
        break;
        default:
          setTitle(topPic.title);
          setBG(topPic.url);
      }


    },
    setTitle = function( title ){
      //double check we have our image
      if( gotOurImage ){
        var el = document.querySelector('.pic-info-text');
        el.innerHTML = title;
      }
    },
    setBG = function(bgURL) {
      //double check we have our image
      if( gotOurImage ){
        var el = document.querySelector('.main');
        el.style.backgroundImage = "url("+bgURL+")";
      }
    };


});
