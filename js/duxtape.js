function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function songDuration(seconds) {
  return Math.floor(seconds / 60) + ":" + pad(Math.floor(seconds % 60), 2)
}

function parseDuration(str) {
  let parts = str.split(":"), base = 1, duration = 0
  while (parts.length > 0) {
    duration += new Number(parts.pop()) * base
    base *= 60
  }
  return duration
}

function updateTape(songs, duration) {
  let h2 = document.querySelector('h2')
  let lenEle = h2.querySelector('.tape-length')
  let durEle = h2.querySelector('.tape-duration')
  lenEle.innerText = songs + new Number(lenEle.innerText)
  durEle.innerText = songDuration(duration + parseDuration(durEle.innerText))
}

function playMusic(link) {
  // Start audio player.
  let player = document.getElementById('player')
  player.src = link.href
  player.play()

  // Turn on visual style on the song.
  u(link).parent().parent().addClass('playing').
    prepend('<div class="progress"><div></div></div>')
}

function stopMusic() {
  // Stop audio player.
  let player = document.getElementById('player')
  player.removeAttribute('src')
  player.pause()

  // Turn off visual style on the song.
  let playing = u('main li.playing').removeClass('playing')
  playing.children('.progress').remove()
  return playing
}

function onPlay(e) {
  e.preventDefault()
  e.stopPropagation()
  var lastItem = stopMusic()
  var lastLink = lastItem.find('h3 a').first()
  if (lastLink !== e.currentTarget)
    playMusic(e.currentTarget)
}

function onPlayNext(e) {
  var lastItem = stopMusic()
  var nextItem = lastItem.first().nextElementSibling
  if (!nextItem) return
  playMusic(u('h3 a', nextItem).first())
}

function onPlayProgress(e) {
  let elapsed = e.currentTarget.currentTime
  let playing = u('main li.playing').first()
  let total = parseDuration(u('.length', playing).text())
  let percent = (elapsed / total) * 100
  u('.progress > div', playing).attr('style', 'width: ' + Math.floor(percent) + '%')
}

(async function () {
  let archive = new DatArchive(window.location)
 
  async function addWrite(dat, path, str) {
    try {
      await dat.stat(path)
    } catch (e) {
      await dat.writeFile(path, str)
    }
  }

  async function forceWrite(dat, path, str) {
    try {
      await dat.rmdir(path)
    } catch (e) {
    }
    await dat.writeFile(path, str)
  }

  async function readFiles(files) {
    let mm = require('music-metadata-browser')
    let count = files.length
    if (count > 0) {
      stopMusic()
      for (let i = 0; i < count; i++) {
        let file = files[i]
        if (!file.type.match('audio/.*'))
          continue
        mm.parseBlob(file, {duration: true}).then(meta => {
          let path = '/' + file.name
          let reader = new FileReader()

          reader.onload = async function () {
            // Add the music file to the dat.
            // TODO: preview = archive.checkout('preview')
            await addWrite(archive, path, reader.result)

            // Create the entry in the playlist.
            let title = file.name
            if (meta.common.artist && meta.common.title)
              title = meta.common.artist + ' - ' + meta.common.title
            let link = u('<a>').attr('href', path).text(title)
            let h3 = u('<h3>').append(link)
            let p = u('<p><span class="length">' +
                songDuration(meta.format.duration) + '</span>&nbsp;')
            if (meta.common.album)
              p.append(u('<span class="album">').text(meta.common.album))
            if (meta.common.year) {
              p.append(' (').
                append(u('<span class="year">').text(meta.common.year)).
                append(')')
            }
            u('main > ol').append(u('<li class="song">').append(h3).append(p))

            // Handle playing songs.
            link.on('click', onPlay)

            // Write the HTML to the Dat.
            updateTape(1, meta.format.duration)
            await forceWrite(archive, '/index.html', document.documentElement.innerHTML)
          }

          reader.readAsArrayBuffer(file)
        })
      }
    }
  }

  ready(async function () {
    let archiveInfo = await archive.getInfo()
    let h1 = document.querySelector('h1')
    if (h1.innerText == "MUXTAPE by SOMEONE") {
      h1.querySelector('.tape-title').innerText = archiveInfo.title
    }

    // Add editor controls, if this person owns the tape.
    if (archiveInfo.isOwner) {
      document.addEventListener('dragover', ev => ev.preventDefault())
      document.addEventListener('drop', ev => {
        ev.preventDefault()
        readFiles(ev.dataTransfer.files)
      })
    }

    u('h3 a').on('click', onPlay)

    let player = document.getElementById('player')
    player.addEventListener('ended', onPlayNext)
    player.addEventListener('timeupdate', onPlayProgress)
  })
})()
