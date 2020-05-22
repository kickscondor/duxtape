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
      if (addurl.startsWith('hyper://') && checkTape(cat, addurl)) {
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

  // Receive messages from other connected peers.
  var channel = beaker.peersockets.join('duxtape')
  channel.addEventListener('message', ({peerId, message}) => {
    let tapes = JSON.parse(new TestDecoder().decode(message))
    displayTapes('discovered', addTapes('discovered', tapes))
  })

  // Advertise my tapes to connected peers. (Will send to currently
  // joined AND any future peers.)
  // https://docs.beakerbrowser.com/apis/beaker.peersockets#beaker-peersockets-watch
  var peers = beaker.peersockets.watch()
  peers.addEventListener('join', ({peerId}) => {
    channel.send(peerId, {tapes: Object.keys(allTapes)})
  })

  // TODO: I'd like to use beaker.hyperdrive.drive(url).watch(path) to detect changes
  // to a JSON file that could also contain tapes. This way seeded files could also
  // propagate tapes even if Beaker isn't seeding it.

  async function onCreateTape (e) {
    e.preventDefault()
    e.stopPropagation()

    // Write the tape's home page.
    let tape = await beaker.hyperdrive.createDrive({title: "A Duxtape."})
    let archive = await beaker.hyperdrive.drive(window.location)
    let html = await archive.readFile('tape.html')
    html2 = html.replace(/="\//g, '="' + archive.url + '/')
    await tape.writeFile('index.html', html2)

    // Add the album to our list.
    addTapes('favorites', [tape.url])

    // Go to the new archive.
    window.location = tape.url
  }

  async function displayTapes(cat, ary) {
    let ol = u('ol.' + cat)
    let i = ary.length
    let checkAccess = (cat === 'discovered')
    while (i--) {
      let url = ary[i]
      if (ol.find('a[href="' + url + '"]').length == 0) {
        let dat = await beaker.hyperdrive.drive(url)
        // dat.getInfo().then(info => {
          // TODO: Get info.peers - info.writable is definitely there.
          // if (checkAccess && !info.writable && (info.peers == 0 || !info.type.includes("duxtape")))
          //   return
          dat.readFile('/index.html').then(html => {
            let doc = u('<div>').html(html)
            if (checkAccess &&
                (doc.find('li.song').length == 0 ||
                 doc.find('meta[name="generator"]').attr('content') !== 'Duxtape' ||
                 doc.find('meta[name="duxtape:access"]').attr('content') !== 'public')) {
              removeTape(cat, url)
              return
            }

            let item = u('<li>')
            let tapestyle = doc.find('header').attr('style')
            let fave = u('<a class="star" href="#">&#x2605;</a>')
            if (tapestyle)
              item.attr('style', tapestyle)
            ol.append(item.append(fave).append(u('<a>').
              attr('href', url).append(doc.find('h1').text()))
              // .append(u('<span>').text(info.peers + " peers"))
            )
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
        // })
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

      ['favorites', 'discovered'].forEach(x => displayTapes(x, duxtapes[x]))
    }
  })
})()
