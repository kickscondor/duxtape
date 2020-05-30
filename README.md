
This is a Muxtape clone for the Hypercore network. You'll need
[Beaker](https://beakerbrowser.com/) to listen to tapes, create tapes.
Mere nostalgia, let's say.

![Screenshot](/duxtape.png)

To try it out, visit this url in Beaker:
hyper://5b69209fc2dfb5eafb82e4031cd43c28ebc61e5cdd4dbdc48310bb62263f53e0/.

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

A sample mixtape is at:
hyper://61477c44215c195bb5514cf6dcca86f4f4784822dbc24a6f944aa68cfc021e1c/.
To seed the tape on the network, click the sideways-V 'network' icon in the
browser address bar. You should find a toggle there.

You currently can only edit the tape from the browser where it was created.
