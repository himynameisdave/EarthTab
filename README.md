EarthTab
---

EarthTab pulls images from [Reddit's SWF Nature Porn]((http://www.reddit.com/r/sfwpornnetwork/wiki/network#wiki_nature)) network to transform your new tabs into beautiful windows into Earth's natural beauty.

![EarthTab](http://i.imgur.com/oU21fPt.jpg)

Head on over to the Chrome Web Store to install.

[![Chrome Web Store](https://developer.chrome.com/webstore/images/ChromeWebStore_Badge_v2_206x58.png)](http://bit.ly/earthtab)

---

### Developing

Development within the EarthTab repo is a breeze thanks to Gulp, which automagically cleans and compiles everything down to a nice little zip for you (which is what Google uploads to the Chrome Web Store for you).

Once you've got the repo, run `npm i` to install a few Gulp deps.

Running `gulp` simply offers you a watch on the Less files and compiles them for you.

`gulp build` will compile the Less, strip `console.log`'s & uglify from the JS, and will compress everything into a `.zip` file for you.

---

*Copyright (c) 2015 [Dave Lunny](http://himynameisdave.com) Licensed under the MIT licence*
