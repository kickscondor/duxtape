/* Thank you to Tara Vancil -- I am ripping off her 'dat-photos-app' here. */
(async function () {
  async function onCreateTape (e) {
    e.preventDefault()
    e.stopPropagation()

    // Write the tape's home page.
    let tape = await DatArchive.create()
    let archive = new DatArchive(window.location)
    let html = await archive.readFile('tape.html')
    html2 = html.replace(/="\//g, '="' + archive.url + '/')
    await tape.writeFile('index.html', html2)

    // Go to the new archive.
    window.location = tape.url
  }

  ready(function () {
    document.querySelector('.create-tape').
      addEventListener('click', onCreateTape)
  })
})()
