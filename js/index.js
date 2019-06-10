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
  saveTapes()

  function addTapes(cat, urls) {
    urls.forEach(addurl => {
      if (addurl.startsWith('dat://') && checkTape(cat, addurl))
        duxtapes[cat].push(addurl)
    })
    saveTapes()
  }

  // Default starter tapes.
  addTapes("discovered", ["dat://8587f38ad142911bbf29caffe6887080be3c3ff55569be03bacc197c5daa9caa"])

  // Advertise my tapes to connected peers.
  experimental.datPeers.broadcast({tapes: Object.keys(allTapes)})
  experimental.datPeers.addEventListener('connect', ({peer}) => {
    peer.send({tapes: Object.keys(allTapes)})
  })
  experimental.datPeers.addEventListener('message', ({peer, message}) => {
    if (message && message.tapes && message.tapes.length > 0) {
      addTapes('discovered', message.tapes)
      displayTapes('discovered')
    }
  })

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

  async function displayTapes(cat) {
    let ol = u('ol.' + cat).empty()
    for (let i = 0; i < duxtapes[cat].length; i++) {
      let dat = new DatArchive(duxtapes[cat][i])
      let html = await dat.readFile('/index.html')
      let doc = u('<div>').html(html)
      let item = u('<li>')
      let tapestyle = doc.find('header').attr('style')
      if (tapestyle)
        item.attr('style', tapestyle)
      ol.append(item.append(u('<a>').
        attr('href', dat.url).append(doc.find('h1').text())))
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
      u('#content').append('<ol class="favorites tapes"></ol>')
      if (duxtapes.discovered.length > 0) {
        u('#content').append("<h3>Mixtapes you've discovered:</h3>" +
          '<ol class="discovered tapes"></ol>')
      }
      ['favorites', 'discovered'].forEach(displayTapes)
    }
  })
})()
