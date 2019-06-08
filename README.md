This is a Muxtape clone for the Dat network. You'll need
[Beaker](https://beakerbrowser.com/) to listen to tapes, create tapes.
Mere nostalgia, let's say.

To try it out, visit dat://duxtape.kickscondor.com/.

If you don't know what Muxtape was, it was a short-lived website for sharing
mp3 mix tapes. It's design was absolutely bare: just the songs you uploaded.
But it functioned. You could create and listen to mixtapes in the browser.
It was shuttered within the year and made an attempt to return... don't recall
what happened next.

Dat seems perfect for this kind of thing. Not only could you seed the mixtapes
that are shared, but you can seed the app itself!

Here's the tech behind it:

* [music-metadata-browser](https://github.com/Borewit/music-metadata-browser):
  A JavaScript library for reading title and artist metadata from songs.
* [color-picker](https://github.com/Simonwep/pickr): One of the only things you
  could customize on Muxtape was the color of your banner. A JavaScript color
  picker was essential.
* [Web File API](https://developer.mozilla.org/en-US/docs/Web/API/File):
  Files are dropped onto the web page and copied into your Dat. This local Dat
  is just a folder that is synchronized with any seeds out there.
* [Web Audio
  API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API):
  This is one thing we didn't have back in 2008. I appreciate this.

A sample mixtape is at:
dat://8587f38ad142911bbf29caffe6887080be3c3ff55569be03bacc197c5daa9caa/.
To seed the tape on the network, click the sideways-V 'network' icon in the
browser address bar. You should fine a toggle.

You currently can only edit the tape from the browser where it was created.
