# node-factorio-api

* * *

Download and update mods from the Factorio Mod Portal

* * *

[![https://nodei.co/npm/node-factorio-api.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/node-factorio-api.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/node-factorio-api)

[![Dependency Status](https://david-dm.org/Danacus/node-factorio-api.svg)](https://david-dm.org/Danacus/node-factorio-api)

## Table of Contents

- [node-factorio-api](#node-factorio-api)
  * [Features](#features)
  * [Installation](#installation)
  * [Usage](#usage)
      - [Examples](#examples)
  * [Documentation](#documentation)
  * [Useful information](#useful-information)


## Features

-   [x] Download mods
-   [x] Update mods
-   [x] Search/list mods
-   [x] Remove mods
-   [x] Download dependencies
-   [x] Get mods from saves
-   [x] Get mods from server
-   [x] Search/list servers
-   [x] Read mod zip file (get info.json)
-   [x] Download the game client

## Installation

I recommend using yarn instead of npm, because it's (a lot) faster.

`yarn add node-factorio-api` (or `npm install node-factorio-api`)

## Usage

```javascript
import api from 'node-factorio-api'
// Initialize the api
api.init(false, 'path/to/mods/folder', 'path/to/saves/folder', '0.14.0')
// Set to true if you want to allow multiple version of a mod
```

#### Examples

```javascript
// You must provide a username and a password or token
api.authenticate({
  username: '',
  token: '',
  password: '',
  require_ownership: false
}).then(token => {
    // Search for mods that contain 'bob'
    api.searchMods(
      'bob'
    ).then((body) => {
        // Download the found mods
        api.downloadMods(body.results.map(x => {
          return {name: x.name}
        })).then(() => {
            // Remove all mods that start with 'bob' (glob patterns)
            api.removeModsMatching({name: "bob*"}).then(() => {
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
          api.removeMods([
            {name: 'Foreman'},
            {name :'Factorissimo2'},
            {name :'FARL', version: '0.7.4'}
          ]).then(() => {
            // Done
          })
        })
    })

    // Download all require dependencies
    api.downloadDependencies({name: 'bobores'}, false).then(() => {
      // Done
    })

    // Download all dependencies (including optional) from version 0.14.0
    api.downloadDependencies(
      {name: 'bobores', version: '0.14.0'}, true)
    .then(() => {
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
    api.getModsFromSave('my_awesome_factory').then((mods) => {
      // mods is an array of all mods in a save with name and version
    })

    api.getModsFromSaveFile('my_awesome_factory.zip').then((mods) => {
      // mods is an array of all mods in a save with name and version
    })

    api.getModsFromSaves().then(list => {
      // list is an array
      /* Example output
        [
          {
            name: "my_awesome_factory",
            mods: [
              {
                name: "an_awesome_mod",
                version: "1.2.3"
              },
              {
                name: "another_awesome_mod",
                version: "3.2.1"
              }
            ]
          },
          {
            name: "my_other_factory",
            mods: [
              {
                name: "yet_another_mod",
                version: "4.2.3"
              },
              {
                name: "another_nice_mod",
                version: "3.8.1"
              }
            ]
          }
        ]
      */
    })

    api.readModZip({name: "FARL", version: "0.7.4"}).then((info) => {
      // info is the parsed info.json file of the mod
    })

    api.readModZipFile("FARL_0.7.4.zip").then((info) => {
      // info is the parsed info.json file of the mod
    })

    api.readModZips().then((list) => {
      // list is an array with the parsed info.json file of each mod
    })

    // Get the latest experimental version
    api.getLatestGameVersion('experimental').then(version => {
      // Download that version of the full client for Linux
      // Please note that downloading the full client requires you to be 
      // logged in with either your password or with a session id
      return api.downloadGame({version, build: 'alpha', distro: 'linux64'});
    }).progress(value => {
      // Log the percentage of the progress
      console.log(Math.round(value * 100) + '%');
    }).then(() => {
      // It's done!
      console.log("Done!");
    }).catch(err => {
      // Catch any potential errors
      console.log(err);
    });
}).catch(err => {
    // Oops! Something went wrong
})

// You can call function outside the Promise of api.authenticate,
// but make sure that it's authenticated first
if (api.isAuthenticated()) {
    api.downloadMod({name: 'Foreman'}).then(() => {
        //Done
    })
}
```

## Documentation

[Documentation](https://github.com/Danacus/node-factorio-api/wiki/Documentation)

## Useful information

- https://wiki.factorio.com/Mod_Portal_API
- https://wiki.factorio.com/Matchmaking_API
- https://wiki.factorio.com/Web_Authentication_API
