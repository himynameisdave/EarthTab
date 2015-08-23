/*||
||||   Module::Utils
||||
||||   Some utility functions cause yay
*/


var Utils = function(){
  return {
    /**   @name:    addClass
      *   @params:  el [string, selector], class [string]
      *   @desc:    simplifies adding a class to an element
      */
    addClass: function( el, className ){
      var element;
      if( typeof el === 'object' )
        element = el;
      else if( typeof el === 'string' )
        element = document.querySelector( el );
      else
        throw "addClass() needs either an element or a selector string!";
      element.classList.add(className);
    },
    /**   @name:    convertImgToBase64URL
      *   @params:  url [string], callback [function], outputFormat [string]
      *   @desc:    creates a base64 of an image based on a given URL. ASYNC
      *
      *   Mega props to this Stackoverflow post:
      *   http://stackoverflow.com/a/20285053/4060044
      */
    convertImgToBase64URL: function(url, callback, outputFormat){
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
    },
    /**   @name:   getHrsDiff
      *   @params: oldTime [number, timestamp], newTime [number, timestamp]
      *   @desc:   returns the number of hours between two given times, NOT ROUNDED
      */
    getHrsDiff: function( oldTime, newTime ){
      var diff = newTime - oldTime;
      return (diff/60)/60;
    },
    /**   @name:    resolveElement
      *   @params:  el [string, selector OR DOM element object]
      *   @desc:    handy utility that returns the actual element, whether passed a selector string or actual element
      */
    /**   @name:   longerThanMins
      *   @params: then [number, timestamp], maxMins [number]
      *   @desc:   returns true if more mins have passed since 'then' than specified by 'maxMins'
      */
    longerThanMins: function( then, maxMins ) {
      //  difference is then vs now in miliseconds, then divided into 60 for minutes
      var diff = ((Date.now() / 1000) - then)/60;
      return diff > maxMins ? true : false;
    },
    resolveElement: function( el ){
      var element;
      if( typeof el === 'string' )
        element = document.querySelector(el);
      else if( typeof el === 'object' )
        //  TODO: check that it's a real DOM object
        element = el;
      else
        throw "Not a real element!\nPlease pass either a selector string or element object!";
      return element;
    },
    /**   @name:    removeClass
      *   @params:  el [string, selector], class [string]
      *   @desc:    simplifies removing a class from an element
      */
    removeClass: function( el, className ){
      var element;
      if( typeof el === 'object' )
        element = el;
      else if( typeof el === 'string' )
        element = document.querySelector( el );
      else
        throw "removeClass() needs either an element or a selector string!";
      element.classList.remove(className);
    },
    truncatePostTime: function( hrs ){
      var h, s;
      if( hrs < 24 ){
        h = Math.floor(hrs);
        s = (h > 1 ? " hrs" : " hr");
        return h + s;
      }
      if( hrs >= 24 && hrs < 168 ){
        h = Math.floor(hrs/24);
        s = (h > 1 ? " days" : " day");
        return h + s;
      }
      if( hrs >= 168 ){
        h = Math.floor(hrs/168);
        s = (h > 1 ? " weeks" : " week");
        return h + s;
      }
    }
  }
};


module.exports = Utils;