# node-factorio-api

----------

Download and update mods from the Factorio Mod Portal


----------


### Features
- [x] Download mods
- [x] Update mods
- [x] Search/list mods
- [ ] Remove mods
- [ ] Get mods from saves
- [ ] Get mods from server
- [ ] Search/list servers

## Usage

```javascript
import Api from 'factorio-api'
// Create a new instance
let api = new Api("path/to/mods/folder", false)
// Set to true if you want to allow multiple version of a mod
```

#### Examples
```javascript
// You must provide a username and a password or token
api.authenticate({username: '', token: '', password: '', require_ownership: false}).then(token => {
    // Search for top 5 mods that contain 'bob'
    api.searchMods({q: 'bob', order: 'top', page_size: 5}).then((body) => {
        // Download the found mods
        api.downloadMods(body.results.map(x => {return {name: x.name}})).then(() => {
            // Remove all mods that start with 'bob'
            api.removeMods({name: "bob*"}).then(() => {
                //Done
            })
        })
    })

    // Download Foreman version 1.0.0
    api.downloadMod({name: 'Foreman', version: '1.0.0'}).then(() => {
        // Download the latest version of Foreman
        // This will remove all other installed foreman versions
        api.downloadMod({name: 'Foreman'}).then(() => {
            //Done
        })
    })

    // Checks for updates and installs the latest version
    // version is the version of the currently installed mod
    api.updateMods([
        {name: 'FARL', version: '0.0.1'},
        {name :'blueprint-string', version: '4.0.0'}
    ]).then(() => {
        // Download Foreman and Factorissimo2 after updating FARL and blueprint-string
        api.downloadMods(['Foreman', 'Factorissimo2'].map(x => {return {name: x}})).then(() => {
          // Done
        })

        // Does the same thing. The code above can be useful in some cases.
        api.downloadMods([
            {name: 'Foreman'},
            {name :'Factorissimo2'}
        ]).then(() => {
          // Done
        })
    })
}).catch(err => {
    // Oops! Something went wrong
})

// You can call function outside the Promise of api.authenticate,
// but make sure that it's authenticated first
if (api.isAuthenticated) {
    api.downloadMod({name: 'Foreman'}).then(() => {
        //Done
    })
}
```
