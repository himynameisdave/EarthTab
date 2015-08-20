/*||
||||   Module::Clock
||||
||||   Responsible for setting/updating the clock
||||   based on the element selector passed to the function
*/


var Clock = function( element ){
  return {
    el: document.querySelector(element),
    /**   @name:    setClock
      *   @params:  oldTime [number, time; optional]
      *   @desc:    recursivly checks the time and alters it in the DOM
      *             essentially a self-contained worker function
      */
    setClock: function( oldTime ){
      var t = new Date(),
          h = t.getHours(),
          m = t.getMinutes();
          if (m<10) { m = "0"+m; }
          if( h > 12 ){
            h = h - 12;
          }
      var time = h+":"+m;

      if(!oldTime || oldTime !== time)
        this.el.innerHTML = time;

      var timeout = setTimeout(function(){
        this.setClock(this.el, time);
      }.bind(this), 5000);// five seconds is a lot but I'd rather that then taking the performance hit
    }

  }
};

module.exports = Clock;