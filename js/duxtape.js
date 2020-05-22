//
// Helper functions
//
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

function listenForEnter(u) {
  return u.on('keydown', ev => {
    if (ev.keyCode === 13 || ev.keyCode === 27) {
      ev.currentTarget.blur()
      return false
    }
  })
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
  player.src = link.newFile ?
    window.URL.createObjectURL(link.newFile) : link.href
  player.play()

  // Turn on visual style on the song.
  u(link).parent().parent().addClass('playing').
    prepend('<div class="progress"><div></div></div>')
}

function stopMusic(shouldPause) {
  // Stop audio player.
  let playing = u('main li.playing')
  let player = document.getElementById('player')
  if (shouldPause && player.paused)
    player.play()
  else if (!player.paused)
    player.pause()

  if (!shouldPause) {
    // Turn off visual style on the song.
    player.removeAttribute('src')
    playing.removeClass('playing')
    playing.children('.progress').remove()
  }

  return playing
}

function onPlay(e) {
  e.preventDefault()
  e.stopPropagation()
  var lastItem = stopMusic(true)
  var lastLink = lastItem.find('h3 a').first()
  if (lastLink !== e.currentTarget && e.currentTarget.className !== "editing") {
    stopMusic(false)
    playMusic(e.currentTarget)
  }
}

function onPlayNext(e) {
  var lastItem = stopMusic(false)
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

function addScript(src, fn) {
  let s = document.createElement("script")
  s.src = src
  s.className = "editor"
  if (fn) s.onload = fn
  document.head.appendChild(s)
  return s
}

function selectEle(ele) {
  let range = document.createRange()
  range.selectNodeContents(ele)
  let sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
}

/* From https://stackoverflow.com/questions/10588607/tutorial-for-html5-dragdrop-sortable-list */
var _el

function getListItem(ele) {
  let li = u(ele).closest('li').first()
  return li ? li : ele
}

function dragStart(e) {
  e.dataTransfer.effectAllowed = "move"
  e.dataTransfer.setData("text/plain", null) // Thanks to bqlou for their comment.
  _el = getListItem(e.target)
}

function dragEnd(e) {
  _el = null
}

function isBefore(el1, el2) {
  if (!el1 || !el2)
    return 0
  if (el2.parentNode === el1.parentNode)
    for (var cur = el1.previousSibling; cur && cur.nodeType !== 9; cur = cur.previousSibling)
      if (cur === el2)
        return 1;
  return -1;
}

function colorPicker(sel, cls, col, fn) {
  let pickr = new Pickr({el: sel, appClass: cls, default: col,
    swatches: [
      'rgb(244, 67, 54)',
      'rgb(233, 30, 99)',
      'rgb(156, 39, 176)',
      'rgb(103, 58, 183)',
      'rgb(63, 81, 181)',
      'rgb(33, 150, 243)',
      'rgb(3, 169, 244)',
      'rgb(0, 188, 212)',
      'rgb(0, 150, 136)',
      'rgb(76, 175, 80)',
      'rgb(139, 195, 74)',
      'rgb(205, 220, 57)',
      'rgb(255, 235, 59)',
      'rgb(255, 193, 7)'
    ],

    components: {
      preview: true,
      hue: true,
      opacity: false,

      interaction: {
        hex: true,
        input: true,
        save: true,
        clear: true
      }
    }
  })
  pickr.on('save', (c) => {
    fn(c.toRGBA().toString())
  })
  return pickr
}

//
// Actual logic for this app starts here.
//
(async function () {
  let archive = beaker.hyperdrive.drive(window.location),
    newFiles = [], delFiles = []
 
  async function addWrite(dat, path, str) {
    try {
      await dat.stat(path)
    } catch (e) {
      await dat.writeFile(path, str)
    }
  }

  async function forceWrite(dat, path, str) {
    try {
      await dat.unlink(path)
    } catch (e) {
    }
    await dat.writeFile(path, str)
  }

  async function forceDelete(dat, path) {
    try {
      await dat.unlink(path)
    } catch (e) {
    }
  }

  // All songs and metadata are written to the Dat.
  async function writeAllChanges() {
    while (delFiles.length > 0) {
      await forceDelete(archive, delFiles.pop())
    }

    while (newFiles.length > 0) {
      let nf = newFiles.pop()
      await addWrite(archive, nf.path, nf.data)
    }

    let doc = u(document.documentElement).clone()
    let newTitle = doc.find('.tape-title').text()
    let info = await archive.getInfo()
    if (info.title !== newTitle)
      archive.configure({title: newTitle})

    doc.find('.editor').remove()
    doc.find('.editing').removeClass('editing').
      each((node, i) => node.removeAttribute('contenteditable'))
    await forceWrite(archive, '/index.html', doc.html())
  }

  async function markToPublish() {
    document.getElementById("publish").disabled = false
  }

  async function dragOver(e) {
    let li = getListItem(e.target)
    let index = isBefore(_el, li)
    if (index == 0)
      return
    li.parentNode.insertBefore(_el, index > 0 ? li : li.nextSibling)
    markToPublish()
  }

  async function addSongEdit(duxHome, li) {
    // Song rename button
    let ren = u('<a href="#" class="editor rename"><img src="' + duxHome + '/images/270f.png"></a>')
    ren.on('click', ev => {
      let title = u(ev.currentTarget.previousElementSibling)
      selectEle(title.attr('contenteditable', 'true').addClass('editing').first())
    })
    listenForEnter(li.find('h3 a')).
      on('blur', ev => {
        let a = ev.currentTarget
        if (a.className == 'editing') {
          a.removeAttribute('contenteditable')
          a.removeAttribute('class')
          markToPublish()
        }
      })
    li.find('h3').append(ren)

    // Song delete button
    let del = u('<a href="#" class="editor delete">&#x1f525; <span>Delete</span></a>')
    del.on('click', ev => {
      let l = u(ev.currentTarget).closest('li')
      let a = l.find('h3 a')
      if (confirm('You really want to delete "' + a.text() + '"?')) {
        l.remove()
        let path = a.attr('href')
        for (let i = 0; i < newFiles.length; i++) {
          if (newFiles[i].path == path) {
            newFiles.splice(i, 1)
            break
          }
        }
        delFiles.push(path)
        markToPublish()
      }
    })
    li.find('p').append(del)
  }

  async function readFiles(duxHome, files) {
    let mm = require('music-metadata-browser')
    let count = files.length
    if (count > 0) {
      stopMusic(true)
      for (let i = 0; i < count; i++) {
        let file = files[i]
        if (!file.type.match('audio/.*'))
          continue
        mm.parseBlob(file, {duration: true}).then(meta => {
          let path = '/' + file.name
          let reader = new FileReader()
          reader.addEventListener('load', async function (ev) {
            // Create the entry in the playlist.
            let title = file.name
            if (meta.common.artist && meta.common.title)
              title = meta.common.artist + ' - ' + meta.common.title
            let link = u('<a>').attr('href', path).text(title)
            let song = u('<li class="song" draggable="true">')
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
            u('main > ol').append(song.append(h3).append(p))
            addSongEdit(duxHome, song)
            updateTape(1, meta.format.duration)

            // Handle playing songs.
            link.on('click', onPlay)
            song.on('dragover', dragOver)
            song.on('dragstart', dragStart)
            song.on('dragend', dragEnd)

            link.first().newFile = file
            newFiles.push({path: path, data: reader.result})
            markToPublish()
          })
          reader.readAsArrayBuffer(file)
        })
      }
    }
  }

  ready(async function () {
    u('h3 a').on('click', onPlay)

    let duxHome = u('link[rel="stylesheet"]').attr('href').split('/css/')[0]
    let archiveInfo = await archive.getInfo()
    let h1 = document.querySelector('h1')
    if (h1.innerText == "MUXTAPE by SOMEONE") {
      h1.querySelector('.tape-title').innerText = archiveInfo.title
    }

    // Add editor controls, if this person owns the tape.
    if (archiveInfo.writable) {
      addSongEdit(duxHome, u('li.song'))
      u('head').append(u('<link>').attr(
        {rel: 'stylesheet', type: 'text/css', href: duxHome + '/css/pickr.css', class: 'editor'}))
      u('header').prepend(u('<div class="editor"><div class="color-picker">'))
      let tapestyle = u('header').attr('style'), bgcolor = "#F90"
      if (tapestyle)
        bgcolor = tapestyle.match(/background-color:\s*([^;]+)/)[1]
      addScript(duxHome + '/js/pickr.es5.min.js',
        e => colorPicker('.color-picker', 'editor', bgcolor, c => {
          u('header').attr('style', 'background-color: ' + c)
          markToPublish()
        }))

      document.addEventListener('dragover', ev => ev.preventDefault())
      document.addEventListener('drop', ev => {
        ev.preventDefault()
        readFiles(duxHome, ev.dataTransfer.files)
      })

      // Title and author name edits.
      let timer = null
      listenForEnter(u('h1 > span').attr('contenteditable', 'true')).addClass('editing').
        on('blur keyup paste input', e => {
          markToPublish()
          if (timer) clearTimeout(timer)
          timer = setTimeout(_ => {
            u('h1 > span').each((node, i) => {
              if (node.innerText.length === 0)
                node.innerText = "???"
            })
          }, 700)
        })

      // Add the instruction pane.
      u('main li.song').on('dragover', dragOver).
        on('dragstart', dragStart).on('dragend', dragEnd)
      let isPublic = (u('meta[name="duxtape:access"]').attr('content') === 'public')
      u('main').append('<div class="editor file-form">' + 
        '<div id="access"><input type="checkbox" id="accessbox"' + (isPublic ? ' checked' : '') +
        '> <label for="accessbox">Make this public</label>' +
        '<button id="publish" type="button" disabled>Publish</button></div>' +
        '<p>How to create your duxtape:</p>' +
        '<ul><li>Drop music files onto this page or use this: ' +
        '<input type="file" id="musicfile" name="musicfile" accept="audio/*" multiple="multiple">' +
        '</li><li>You can drag songs up and down ' +
        'to order them.</li><li>Style the page by editing the title and color above.</li>' +
        '<li>A <strong>Publish</strong> button will appear to the right&mdash;click that to save your changes.</li></ul>' +
        "<p>That's it! Share and seed your tape with others.</p>" +
        '<div id="overlay"><p></p><img src="' + duxHome + '/images/ripple.svg"></div>')

      // Publishing and uploading buttons in the instruction pane.
      let publish = document.getElementById('publish')
      u(publish).on('click', async function (ev) {
        u("#overlay").addClass('publishing')
        await writeAllChanges()
        publish.disabled = true
        u("#overlay").removeClass('publishing')
      })
      u('#accessbox').on('change', function (ev) {
        let meta = u('meta[name="duxtape:access"]')
        if (ev.currentTarget.checked) {
          if (meta.length == 0) {
            u('head').append('<meta name="duxtape:access" content="public">')
          }
        } else {
          meta.remove()
        }
        markToPublish()
      })
      let musicfile = u('#musicfile')
      musicfile.on('change', async function (ev) {
        let f = musicfile.first()
        await readFiles(duxHome, f.files)
        f.value = ''
      })
      window.addEventListener('beforeunload', function (ev) {
        if (!publish.disabled) {
          var message = "You have unpublished changes. You sure you want to leave?"
          ev.returnValue = message
          return message
        }
      })
    } else {
      // If viewing this tape as a visitor, put it in the 'discovered' list.
      u('main').append(u('<iframe>').attr('src', duxHome + '/?add=' +
       encodeURIComponent(archive.url)))
    }

    let player = document.getElementById('player')
    player.addEventListener('ended', onPlayNext)
    player.addEventListener('timeupdate', onPlayProgress)
  })
})()
