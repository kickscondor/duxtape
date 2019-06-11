/* Thank you to Tara Vancil -- I am ripping off her 'dat-photos-app' here. */
(async function () {
  let duxtapes = {favorites: [], discovered: []}
  let duxdata = window.localStorage.getItem('duxtapes')
  if (duxdata)
    duxtapes = JSON.parse(duxdata)

  function saveTapes() {
    window.localStorage.setItem('duxtapes', JSON.stringify(duxtapes))
  }

  let allTapes = {}
  function checkTape(cat, addurl) {
    if (addurl in allTapes)
      return false
    allTapes[addurl] = (cat === 'favorites')
    return true
  }
  ['discovered', 'favorites'].forEach(cat => duxtapes[cat].filter(url => checkTape(cat, url)))
  duxtapes.discovered = duxtapes.discovered.slice(-40)
  saveTapes()

  function addTapes(cat, urls) {
    ary = []
    urls.forEach(addurl => {
      if (addurl.startsWith('dat://') && checkTape(cat, addurl)) {
        duxtapes[cat].push(addurl)
        ary.push(addurl)
      }
    })
    saveTapes()
    return ary
  }

  function removeTape(cat, url) {
    let lst = duxtapes[cat]
    let idx = lst.indexOf(url)
    if (idx > -1) lst.splice(idx, 1)
    delete allTapes[url]
    saveTapes()
  }

  // Advertise my tapes to connected peers.
  if (experimental) {
    experimental.datPeers.broadcast({tapes: Object.keys(allTapes)})
    experimental.datPeers.addEventListener('connect', ({peer}) => {
      peer.send({tapes: Object.keys(allTapes)})
    })
    experimental.datPeers.addEventListener('message', ({peer, message}) => {
      if (message && message.tapes && message.tapes.length > 0) {
        displayTapes('discovered', addTapes('discovered', message.tapes), true)
      }
    })
  }

  async function onCreateTape (e) {
    e.preventDefault()
    e.stopPropagation()

    // Write the tape's home page.
    let tape = await DatArchive.create({type: ["duxtape"],
      description: "A Duxtape."})
    let archive = new DatArchive(window.location)
    let html = await archive.readFile('tape.html')
    html2 = html.replace(/="\//g, '="' + archive.url + '/')
    await tape.writeFile('index.html', html2)

    // Add the album to our list.
    addTapes('favorites', [tape.url])

    // Go to the new archive.
    window.location = tape.url
  }

  async function displayTapes(cat, ary, checkAccess) {
    let ol = u('ol.' + cat)
    let i = ary.length
    while (i--) {
      let url = ary[i]
      if (ol.find('a[href="' + url + '"]').length == 0) {
        let dat = new DatArchive(url)
        dat.readFile('/index.html').then(html => {
          let doc = u('<div>').html(html)
          if (checkAccess && cat === 'discovered' &&
              doc.find('meta[name="duxtape:access"]').attr('content') !== 'public') {
            removeTape(cat, url)
            return
          }

          let item = u('<li>')
          let tapestyle = doc.find('header').attr('style')
          let fave = u('<a class="star" href="#">&#x2605;</a>')
          if (tapestyle)
            item.attr('style', tapestyle)
          ol.append(item.append(fave).append(u('<a>').
            attr('href', url).append(doc.find('h1').text())))
          fave.on('click', e => {
            e.preventDefault()
            e.stopPropagation()
            let c = u(e.currentTarget)
            let olc = c.closest('ol')
            let moveFrom = (olc.is('.favorites') ? 'favorites' : 'discovered')
            let moveTo = (olc.is('.favorites') ? 'discovered' : 'favorites')
            u('ol.' + moveTo).prepend(c.closest('li').remove())
            duxtapes[moveTo].push(url)
            removeTape(moveFrom, url)
            allTapes[url] = (moveTo === 'favorites')
          })
        })
      }
    }
  }

  // Setup the page.
  ready(async function () {
    u('.create-tape').on('click', onCreateTape)

    // Build the list of discovered tapes.
    let add = window.location.search.match(/add=dat[^&]+/g)
    if (add) {
      addTapes('discovered', add.map(x => decodeURIComponent(x.slice(4))))
    } else {
      // Build the list of your tapes.
      u('#content').append('<ol class="favorites tapes"></ol>' +
        "<h3>Mixtapes you've discovered:</h3>" +
          '<ol class="discovered tapes"></ol>');

      ['favorites', 'discovered'].forEach(x => displayTapes(x, duxtapes[x], false))
    }
  })
})()
