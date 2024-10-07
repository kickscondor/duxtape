(async function () {
//
// Load the existing tape list.
//
var duxtape = {discovered: {}}, written = true
try {
  let str = await drive.readFile('/duxtape.json')
  duxtape = JSON.parse(str.toString())
} catch {}
console.log(duxtape)

//
// Periodically save an unsaved list.
//
setInterval(async () => {
  if (!written) {
    try {
      await drive.writeFile('/duxtape.json', JSON.stringify(duxtape))
    } catch (e) {
      console.log(e)
    }
    written = true
  }
}, 5000)

//
// Join the duxtape channel.
//
let topic = `webapp/${drive.discoveryKey.toString('hex')}/duxtape`
console.log(`Join ${topic}`)
let channel = client.peersockets.join(topic, {
  onmessage(peer, buf) {
    try {
      //
      // Add any newly announced tapes to the 'discovered' list.
      //
      var obj = JSON.parse(buf.toString())
      console.log([peer, obj])
      for (let tape of obj.tapes) {
        if (!(tape in duxtape.discovered)) {
          duxtape.discovered[tape] = new Date()
          written = false
        }
      }
    } catch {}
  }
})

//
// Announce the tape list to joining peers.
//
let destroy = client.peers.watchPeers(drive.discoveryKey,
  {onjoin: peer => {
    try {
      console.log(['join', peer])
      let tapes = Object.keys(duxtape.discovered)
      channel.send(peer, Buffer.from(JSON.stringify({tapes})))
    } catch (e) {
      console.log(e)
    }
  }})

return async function () {
  channel.close()
  await destroy()
}

})();
