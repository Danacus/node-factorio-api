import Api from './factorio-api'

let api = new Api("")

api.authenticate({username: 'Danacus', token: '583051c5259eec328eb9ebaa1655a8'}).then((token) => {
  console.log('success: ' + token);
  api.searchMods({q: 'bob', order: 'top', page_size: 5}).then((body) => {
    api.downloadMods(body.results.map(x => {return {name: x.name}})).then(() => {
      console.log("Downloaded top 5 bobs mods");
    })
  })

  api.updateMods([
    {name: 'FARL', version: '0.0.1'},
    {name :'blueprint-string', version: '4.0.0'}
  ]).then(() => {
    console.log("Updated");
    api.downloadMods(['Foreman', 'Factorissimo2'].map(x => {return {name: x}})).then(() => {
      console.log("Downloaded Foreman and Factorissimo2");
    })
  }).catch((err) => {
    console.error(err);
  })
})
