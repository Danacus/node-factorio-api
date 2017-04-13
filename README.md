# node-factorio-api

* * *

Download and update mods from the Factorio Mod Portal

* * *

[![https://nodei.co/npm/node-factorio-api.png?downloads=true&downloadRank=true&stars=true](https://nodei.co/npm/node-factorio-api.png?downloads=true&downloadRank=true&stars=true)](https://www.npmjs.com/package/node-factorio-api)

[![Dependency Status](https://david-dm.org/Danacus/node-factorio-api.svg)](https://david-dm.org/Danacus/node-factorio-api)

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

## Installation

`npm install node-factorio-api`

## Usage

```javascript
import api from 'node-factorio-api'
// Initialize the api
api.init("path/to/mods/folder", false)
// Set to true if you want to allow multiple version of a mod

// Optional: add path for saves
api.setSavesPath('path/to/saves/folder')
```

#### Examples

```javascript
// You must provide a username and a password or token
api.authenticate({username: '', token: '', password: '', require_ownership: false}).then(token => {
    // Search for top 5 mods that contain 'bob'
    api.searchMods({q: 'bob', order: 'top', page_size: 5}).then((body) => {
        // Download the found mods
        api.downloadMods(body.results.map(x => {return {name: x.name}})).then(() => {
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

## Documentation

<!-- Generated by documentation.js. Update this documentation by updating the source code. -->

### init

This function initializes the api.

**Parameters**

-   `allowMultipleVersions` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?**  (optional, default `false`)
-   `modPath` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** path to the mods folder (optional, default `''`)
-   `savePath` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** path to the saves folder (optional, default `''`)
-   `gameVersion` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** the version of the game (optional, default `'0.0.0'`)

### setGameVersion

This function sets the game version.

**Parameters**

-   `gameVersion` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version of the game

### setModPath

This function sets the mod path.

**Parameters**

-   `modPath` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the mods folder

### setSavePath

This function sets the save path.

**Parameters**

-   `savePath` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the saves folder

### getSavePath

This function gets the save path.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the saves folder

### getModPath

This function gets the mod path.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** path to the mods folder

### getGameVersion

This function gets the game version.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version of the game

### isAuthenticated

This function returns true if the api is authenticated

Returns **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)** authenticated

### authenticate

This function authenticates with a username and password or token

**Parameters**

-   `props` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the properties for authentication
    -   `props.username` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the username
    -   `props.password` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** not recommended, use token instead
    -   `props.token` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the player token, can be found in player-data.json

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>** returns token if resolved

### getMod

-   **See: [Factorio Wiki](https://wiki.factorio.com/Mod_Portal_API#Result_Entry)**

This function gets the full information of a mod

**Parameters**

-   `name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns the information about the mod if resolved

### getMods

-   **See: [Factorio Wiki](https://wiki.factorio.com/Mod_Portal_API#Result_Entry)**

This function gets the full information of multiple mods

**Parameters**

-   `mods` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** the mods
    -   `mods[].name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>>** returns array of mods with the information about each mod if resolved

### searchMods

This function searches for mods on the Mod Portal

**Parameters**

-   `props` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the search properties, some examples below, there might be more options
    -   `props.q` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** a search query
    -   `props.order` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the order of mods, possible values: top, alpha, updated
    -   `props.page_size` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the size of a page

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns the result if resolved (here's an example: <https://mods.factorio.com/api/mods?q=FARL>)

### updateMod

-   **See: [Factorio Wiki](https://wiki.factorio.com/Mod_Portal_API#Result_Entry)**

This function downloads the latest version of a mod, compatible with the given game version, if there's a more recent version available

**Parameters**

-   `mod` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the mod you want to update
    -   `mod.name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod
    -   `mod.version` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version you have installed
-   `factorioVersion` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** the version of the game (optional, default `this.gameVersion`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns the information about the mod if resolved

### updateMods

-   **See: [Factorio Wiki](https://wiki.factorio.com/Mod_Portal_API#Result_Entry)**

This function updates all given mods and resolves if all mods are downloaded

**Parameters**

-   `mods` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** the mods you want to update
-   `mod[].name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod
-   `mod[].version` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version you have installed
-   `factorioVersion` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** the version of the game (optional, default `this.gameVersion`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns the information about each mod if resolved

### checkUpdate

This function checks for updates for a mod, compatible with the given game version

**Parameters**

-   `mod` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the mod you want to update
    -   `mod.name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod
    -   `mod.version` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version you have installed
-   `factorioVersion` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** the version of the game (optional, default `this.gameVersion`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns {onlineMod, hasUpdate: true, version: release.version} if an update is available and returns {onlineMod, hasUpdate: false} when the mod is up-to-date

### checkUpdates

This function checks for updates for all given mods

**Parameters**

-   `mods` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** the mods you want to update
    -   `mods[].name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod
    -   `mods[].version` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version you have installed
-   `factorioVersion` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** the version of the game (optional, default `this.gameVersion`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>>** returns an array of all objects returned by checkUpdate

### downloadMod

-   **See: [Factorio Wiki](https://wiki.factorio.com/Mod_Portal_API#Result_Entry)**

This function downloads a mod

**Parameters**

-   `mod` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the mod you want to download
    -   `mod.name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod
    -   `mod.version` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version you want to download (optional, default is latest)
-   `factorioVersion` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** the version of the game (optional, default `this.gameVersion`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns the online mod information if resolved

### downloadMods

-   **See: [Factorio Wiki](https://wiki.factorio.com/Mod_Portal_API#Result_Entry)**

This function downloads mods

**Parameters**

-   `mods` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the mods you want to download
    -   `mods[].name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod
    -   `mods[].version` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version you want to download (optional, default is latest)
-   `factorioVersion` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)?** the version of the game (optional, default `this.gameVersion`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>>** returns array of online mods if resolved

### downloadModFromUrl

-   **See: [Factorio Wiki](https://wiki.factorio.com/Mod_Portal_API#Releases)**

This function downloads a mod from a url

**Parameters**

-   `url` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the download_url of a release (example: /api/downloads/data/mods/id/name_version.zip)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)>** returns name of the mod if resolved

### removeModsMatching

This function removes all mod zip files matching a glob pattern (relative to mod path)

**Parameters**

-   `mod` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the mod you want to remove
    -   `mod.name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod, can be a glob pattern
    -   `mod.version` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version you want to remove, can be a glob pattern too (optional, if not specified, all versions will be removed)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** resolves if successful

### removeMods

This function removes all mod zip files from the mods in the array

**Parameters**

-   `mods` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** the mods you want to remove
-   `mod[].name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod, can be a glob pattern
-   `mod[].version` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the version you want to remove, can be a glob pattern too (optional, if not specified, all versions will be removed)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** resolves if successful

### downloadDependencies

This function downloads all dependencies for a mod

**Parameters**

-   `mod` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the mod
    -   `mod.name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod
-   `optionalMods` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** set to true if you want to download all optional mods (I don't know why you would ever want to do that, but you can!) (optional, default `false`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns all online mods if resolved

### getDependencies

This function gets all dependencies for a mod

**Parameters**

-   `mod` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the mod
    -   `mod.name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the name of the mod
-   `optionalMods` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** set to true if you want to download all optional mods (I don't know why you would ever want to do that, but you can!) (optional, default `false`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>>** returns array of mods with their name as property ([{name: name_of_the_mod}]) if resolved

### getGames

This function gets all available online games

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns result of the request (<https://multiplayer.factorio.com/get-games?username=>&lt;your_username>&token=&lt;your_token>)

### getGameDetails

This function gets details of a game

**Parameters**

-   `gameId` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the id of an online game (get it from getGames())

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns result of the request (<https://multiplayer.factorio.com/get-games?username=>&lt;your_username>&token=&lt;your_token>)

### getModsFromSaveFile

This function gets mods from a save file

**Parameters**

-   `fileName` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** name of the file, with .zip (relative to save path)
-   `includeFileName` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** if set to false, an array with all mods will be returned (mod is an object with name and version). If set to true, it will return an object with a name property and a mods property resolve({name: name_of_save, mods: mods}) (optional, default `false`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>**

### getModsFromSave

This function gets mods from a save file

**Parameters**

-   `saveName` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** name of the save, without .zip (relative to save path)
-   `includeFileName` **[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)?** if set to false, an array with all mods will be returned (mod is an object with name and version). If set to true, it will return an object with a name property and a mods property resolve({name: name_of_save, mods: mods}) (optional, default `false`)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>**

### getModsFromSaves

This function gets mods from all save files

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>>** see docs for getModsFromSave for more info, includeFileName is always true (otherwise it would be confusing)

### readModZipFile

This function reads info.json from a zip file of a mod

**Parameters**

-   `fileName` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** name of the mod, with .zip (relative to mod path)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns parsed info.json file if resolved

### readModZip

This function reads info.json from a zip file of a mod

**Parameters**

-   `mod` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the mod you want to get info.json from
    -   `mod.name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** name of the mod
    -   `mod.version` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** verison of the mod

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** returns parsed info.json file if resolved

### readModZips

This function reads info.json from all zip files in mod path

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>>** returns array of parsed info.json files (sorted alphabetically) if resolved

### loadInstalledMods

This function reads info.json from all zip files in mod path and applies information from mod-list.json to it (enabled or disabled)

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)&lt;[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>>** returns array of parsed info.json files (sorted alphabetically) with enabled property if resolved

### saveModList

This function saves the mod list

**Parameters**

-   `mods` **[Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array)&lt;[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)>** all the installed mods
    -   `mods[].name` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** name of the mod
    -   `mods[].enabled` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** enabled property of the mod

Returns **[Promise](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)**

## Useful information

- https://wiki.factorio.com/Mod_Portal_API
- https://wiki.factorio.com/Matchmaking_API
- https://wiki.factorio.com/Web_Authentication_API
