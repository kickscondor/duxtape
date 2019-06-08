/* Thank you to Tara Vancil -- I am ripping off her 'dat-photos-app' here. */
(async function () {
  let duxtapes = {favorites: [], discovered: []}
  let duxdata = window.localStorage.getItem('duxtapes')
  if (duxdata) {
    duxtapes = JSON.parse(duxdata)
  } else {
    window.localStorage.setItem('duxtapes', JSON.stringify(duxtapes))
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
    duxtapes.favorites.push(tape.url)
    window.localStorage.setItem('duxtapes', JSON.stringify(duxtapes))

    // Go to the new archive.
    window.location = tape.url
  }

  // Setup the page.
  ready(async function () {
    u('.create-tape').on('click', onCreateTape)

    // Build the list of discovered tapes.
    let add = window.location.search.match(/add=dat[^&]+/g)
    if (add) {
      for (let i = 0; i < add.length; i++) {
        let addurl = decodeURIComponent(add[i].slice(4))
        if (addurl.startsWith('dat://') && !duxtapes.discovered.includes(addurl))
          duxtapes.discovered.push(addurl)
      }
      window.localStorage.setItem('duxtapes', JSON.stringify(duxtapes))
    } else {
      // Build the list of your tapes.
      u('#content').append('<ol class="favorites tapes"></ol>')
      if (duxtapes.discovered.length > 0) {
        u('#content').append("<h3>Mixtapes you've discovered:</h3>" +
          '<ol class="discovered tapes"></ol>')
      }
      ['favorites', 'discovered'].forEach(async function (cat) {
        let ol = u('ol.' + cat)
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
      })
    }
  })
})()
