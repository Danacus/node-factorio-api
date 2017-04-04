# node-factorio-api

----------

Download and update mods from the Factorio Mod Portal

----------

[![https://nodei.co/npm/node-factorio-api.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/node-factorio-api.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/node-factorio-api)

[![Dependency Status](https://david-dm.org/Danacus/node-factorio-api.svg)](https://david-dm.org/Danacus/node-factorio-api)

## Features
- [x] Download mods
- [x] Update mods
- [x] Search/list mods
- [x] Remove mods
- [x] Download dependencies
- [x] Get mods from saves
- [x] Get mods from server
- [x] Search/list servers

## Installation

`npm install node-factorio-api`

## Usage

```javascript
import Api from 'node-factorio-api'
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

    // Download all require dependencies
    api.downloadDependencies({name: 'bobores'}, false).then(() => {
      // Done
    })

    // Download all dependencies (including optional)
    api.downloadDependencies({name: 'bobores'}, true).then(() => {
      // Done
    })

    // Get all the online games
    api.getGames().then((body) => {
      // Get details from the first game
      api.getGameDetails(body[0].game_id).then((details) => {
        // Download mods for the first game
        // First remove base from the list
        api.downloadMods(details.mods.filter(x => {
          if (x.name == 'base')
            return null
          else
            return x
        })).then(() => {
          //Downloaded mods for the first game
        })
      })

      // Sort the array: most to least players online
      let sortTop = body.sort((a, b) => {
        let countA = 0
        let countB = 0

        if (b.players)
          countB = b.players.length

        if (a.players)
          countA = a.players.length

        return countB - countA
      })
    })

    // Get all the mods used in a saved game
    api.getModsFromSave('level-init.dat').then((mods) => {
      // mods contains all mods in a save with name and version
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
