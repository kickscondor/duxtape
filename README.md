
This is a Muxtape clone for the Dat network. You'll need
[Beaker](https://beakerbrowser.com/) to listen to tapes, create tapes.
Mere nostalgia, let's say.

![Screenshot](/duxtape.png)

To try it out... well, it's down right now. I am waiting for [this
bug](https://github.com/beakerbrowser/beaker/issues/1560) in Beaker. Everything
else has been updated to work as of May 2020. Just need audio to play!

- - -

If you don't know what Muxtape was, it was a short-lived website for sharing
mp3 mix tapes. Its design was absolutely bare: just the songs you uploaded.
But it functioned. You could create and listen to mixtapes in the browser.
It was shuttered within the year and made an attempt to return... don't recall
what happened next.

Hypercore seems perfect for this kind of thing. Not only could you seed the mixtapes
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

A sample mixtape is at: *LINK REMOVED*.
To seed the tape on the network, click the sideways-V 'network' icon in the
browser address bar. You should find a toggle there.

You currently can only edit the tape from the browser where it was created.
