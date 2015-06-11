///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
//////////////////////////////////start////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////

//  Global Settings Object
var $ettings;

document.addEventListener("DOMContentLoaded", function(event) {

  //  get the whole $ettings ball rolling
  $ettings = GetSettings();
  $ettings.init();

  //  Fetch oldData. Async.
  //  TODO: This should all just be an init() fn like settings above.
  chrome.storage.local.get( 'oldData', function(d){
    var randomSub, maxMins, interval;
    //  check if there is any data
    //  FIX for #25 - data was found kinda, but no actual url to use
    if(d.oldData && d.oldData.url){
      //  As of v0.4.0 frequency can no longer be set/is overridden here
      maxMins = 5;
      //  check if it's been longer than 5 mins
      if( longerThanMins( d.oldData.timeSaved, maxMins ) ){
        console.log("It's been longer than "+maxMins+" mins!\nFetching new data!");
        //  grab us a random sub, chosen from the currently selected subs
        if($ettings.finishedInit){
          randomSub = ($ettings.gimmieARandomActiveSub()).toLowerCase();
        }else{
          interval = setInterval(function(){
            if($ettings.finishedInit){
              randomSub = ($ettings.gimmieARandomActiveSub()).toLowerCase();
              clearInterval(interval);
            }
          }, 100);
        }
        //  go fetch some data from that subreddit
        fetchRedditData(parseRedditData, generateRedditUrl( randomSub ));
      }else{
        console.log("It's been less than "+maxMins+" mins!\nUsing old data!");
        //  in case we weren't able to save the base64 last time, let's get that whole process started
        if( !d.oldData.base64Img ){
          //  this function is an async function that converts an image url into a base64 image
          convertImgToBase64URL( d.oldData.url, function(base64data){
            //  saveBase64ToLocalStorage stores our image to the oldData, which is why we need to pass a copy of the old stuff back
            saveBase64ToLocalStorage( d.oldData,  base64data );
          });
        }
        //  go and set the styles and stuffs, using this old data
        setStuff(GetData( d.oldData ));
      }

    }// else, if there is no oldData in
    else{
      if($ettings.finishedInit){
        randomSub = $ettings.gimmieARandomActiveSub().toLowerCase();
        fetchRedditData(parseRedditData, generateRedditUrl( randomSub ));
      }else{
        interval = setInterval(function(){
          if($ettings.finishedInit){
            randomSub = $ettings.gimmieARandomActiveSub().toLowerCase();
            fetchRedditData(parseRedditData, generateRedditUrl( randomSub ));
            clearInterval(interval);
          }
        }, 100);
      }

    }

  });

  //    DOM Setting Shit
  //    MOVED down here as that chrome.storage mafack should be async
  //  Sets the clock
  setClock('.js-time');

  //  sets up the flip event on the main circle
  setupFlipEvent({  el:       'js-flip-container',
                    targetEl: 'js-flip-container',
                    open:     'i-container-s-open',
                    close:    'i-container-s-closed'
                  });

  //  setup the thing to open settings
  setupToggleSettingsEvent({
    settings: document.querySelector('.settings'),
    openSettings: document.querySelector('.js-settings-controller')
  });

  // setup force refresh click event
  document.querySelector('.js-force-refresh').onclick = forceBGRefresh;

});
