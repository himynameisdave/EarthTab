/*||
||||   Module::Flipper
||||
||||   Literally just handles the flip event
*/

var $ = require('./utils.js')();


var Flipper = function(){
  return {
    setup: function( e ){
      var element = document.querySelector('.'+e.el);

      element.addEventListener( 'click', function(){
        if( element.classList.contains(e.close) ){
          $.removeClass( element, e.close );
          $.addClass( element, e.open );
        }
        else if( element.classList.contains(e.open) ){
          $.removeClass( element, e.open );
          $.addClass( element, e.close );
        }else{
          throw "What the whaaaa? http://bit.ly/1IjwmfN";
        }
       });
    }
  }
};


module.exports = Flipper;