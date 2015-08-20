



var UsedImages = function(){
  return {
    images: [],
    init: function(){
      this.getUsedImages( function( images ){
        this.images = images;
      }.bind(this));
    },
    getUsedImages: function( cb ){
      chrome.storage.local.get( 'usedImages', function( d ){
        if(d.images)
          cb( d.images )
      });
    },
    add: function( newImage, cb ){
      //  TODO: check validity of incoming image
      this.images.push(newImage);

      var usedImages = {
        images: this.images
      };

      chrome.storage.local.set( {'usedImages': usedImages}, function(){
        console.log("Added new used image!");
        cb();
      });
    }
  }
};


module.exports = UsedImages;