import rp from 'request-promise'
import semver from 'semver'
import jetpack from 'fs-jetpack'
import path from 'path'
import JSZip from 'jszip'
import request from 'request'
import progress from 'request-progress'

class FactorioAPI {
  /**
 * This function initializes the api.
 * @param {boolean} [allowMultipleVersions=false]
 * @param {string} [modPath=''] path to the mods folder
 * @param {string} [savePath=''] path to the saves folder
 * @param {string} [gameVersion='0.0.0'] the version of the game
 */
  static init(allowMultipleVersions = false, modPath = '', savePath = '', gameVersion = "0.0.0") {
    this.token = null
    this.username = null
    this.modPath = modPath
    this.savePath = savePath
    this.gameVersion = gameVersion
    this.allowMultipleVersions = allowMultipleVersions
    this.authenticated = false
  }

  /**
 * This function sets the game version.
 * @param {string} gameVersion the version of the game
 */
  static setGameVersion(gameVersion) {
    this.gameVersion = gameVersion
  }

  /**
 * This function sets the mod path.
 * @param {string} modPath path to the mods folder
 */
  static setModPath(modPath) {
    this.modPath = modPath
  }

  /**
 * This function sets the save path.
 * @param {string} savePath path to the saves folder
 */
  static setSavePath(savePath) {
    this.savePath = savePath
  }

  /**
 * This function gets the save path.
 * @returns {string} path to the saves folder
 */
  static getSavePath() {
    return this.savePath
  }

  /**
 * This function gets the mod path.
 * @returns {string} path to the mods folder
 */
  static getModPath() {
    return this.modPath
  }

  /**
  * This function gets the game version.
  * @returns {string} the version of the game
  */
  static getGameVersion() {
    return this.gameVersion
  }

  /**
  * This function returns true if the api is authenticated
  * @returns {boolean} authenticated
  */
  static isAuthenticated() {
    return this.authenticated
  }

  /**
 * This function authenticates with a username and password or token
 * @param {Object} props the properties for authentication
 * @param {string} props.username the username
 * @param {string} props.password not recommended, use token instead
 * @param {string} props.token the player token, can be found in player-data.json
 * @returns {Promise.<string>} returns token if resolved
 */
  static authenticate(props) {
    return new Promise((resolve, reject) => {
      props.require_ownership = typeof props.require_ownership !== 'undefined' ? props.require_ownership : false
      if (props.username && props.token) {
        this.token = props.token
        this.username = props.username
        this.authenticated = true
        resolve(props.token)
      } else if (props.username && props.password) {
        let options = {
            method: 'POST',
            uri: 'https://auth.factorio.com/api-login',
            qs: {
                username: props.username,
                password: props.password,
                require_ownership: props.require_ownership
            },
            json: true
        }

        rp(options).then((body) => {
          this.username = body[0]
          this.authenticated = true
          resolve(body[0])
        }).catch((err) => {
          reject(err)
        })
      } else {
        reject("Error: Insufficient information")
      }
    })
  }

  /**
 * This function gets the full information of a mod
 * @param {string} name the name of the mod
 * @returns {Promise.<Object>} returns the information about the mod if resolved
 * @see {@link https://wiki.factorio.com/Mod_Portal_API#Result_Entry|Factorio Wiki}
 */
  static getMod(name) {
    return new Promise((resolve, reject) => {
      let options = {
          method: 'GET',
          uri: `https://mods.factorio.com/api/mods/${name}`,
          json: true
      }

      rp(options).then((body) => {
        resolve(body)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
 * This function gets the full information of multiple mods
 * @param {Object[]} mods the mods
 * @param {string} mods[].name the name of the mod
 * @returns {Promise.<Object[]>} returns array of mods with the information about each mod if resolved
 * @see {@link https://wiki.factorio.com/Mod_Portal_API#Result_Entry|Factorio Wiki}
 */
  static getMods(mods) {
    let promises = mods.map(mod => getMod(mod.name))
    return Promise.all(promises)
  }

  /**
  * This function searches for mods on the Mod Portal
  * @param {Object} props the search properties, some examples below, there might be more options
  * @param {string} props.q a search query
  * @param {string} props.order the order of mods, possible values: top, alpha, updated
  * @param {string} props.page_size the size of a page
  * @returns {Promise.<Object>} returns the result if resolved (here's an example: https://mods.factorio.com/api/mods?q=FARL)
  */
  static searchMods(props) {
    return new Promise((resolve, reject) => {
      let options = {
          method: 'GET',
          uri: `https://mods.factorio.com/api/mods`,
          qs: props,
          json: true
      }

      rp(options).then((body) => {
        resolve(body)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function downloads the latest version of a mod, compatible with the given game version, if there's a more recent version available
  * @param {Object} mod the mod you want to update
  * @param {string} mod.name the name of the mod
  * @param {string} mod.version the version you have installed
  * @param {string} [factorioVersion=this.gameVersion] the version of the game
  * @returns {Promise.<Object>} returns the information about the mod if resolved
  * @see {@link https://wiki.factorio.com/Mod_Portal_API#Result_Entry|Factorio Wiki}
  */
  static updateMod(mod, factorioVersion = this.gameVersion) {
    return new Promise((resolve, reject) => {
      this.checkUpdate(mod, factorioVersion).then((result) => {
        if (result.hasUpdate) {
          this.downloadMod({name: mod.name, version: result.version}).then(() => {
            resolve(result)
          }).catch((err) => {
            reject(err)
          })
        } else {
          resolve(result)
        }
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function updates all given mods and resolves if all mods are downloaded
  * @param {Object[]} mods the mods you want to update
  * @param {string} mod[].name the name of the mod
  * @param {string} mod[].version the version you have installed
  * @param {string} [factorioVersion=this.gameVersion] the version of the game
  * @returns {Promise.<Object>} returns the information about each mod if resolved
  * @see {@link https://wiki.factorio.com/Mod_Portal_API#Result_Entry|Factorio Wiki}
  */
  static updateMods(mods, factorioVersion = this.gameVersion) {
    let promises = mods.map(mod => this.updateMod(mod, factorioVersion))
    return Promise.all(promises)
  }

  /**
  * This function checks for updates for a mod, compatible with the given game version
  * @param {Object} mod the mod you want to update
  * @param {string} mod.name the name of the mod
  * @param {string} mod.version the version you have installed
  * @param {string} [factorioVersion=this.gameVersion] the version of the game
  * @returns {Promise.<Object>} returns {onlineMod, hasUpdate: true, version: release.version} if an update is available and returns {onlineMod, hasUpdate: false} when the mod is up-to-date
  */
  static checkUpdate(mod, factorioVersion = this.gameVersion) {
    return new Promise((resolve, reject) => {
      this.getMod(mod.name).then((onlineMod) => {
        if (factorioVersion.split('.').length < 3) {
          factorioVersion += '.0'
        }
        onlineMod.releases.forEach(release => {
          if (release.factorio_version.split('.').length < 3) {
            release.factorio_version += '.0'
          }
          if (semver.gt(release.version, mod.version)
            && (semver.minor(release.factorio_version) == semver.minor(factorioVersion) || factorioVersion == "0.0.0")) {
            resolve({onlineMod, hasUpdate: true, version: release.version})
          }
        })

        resolve({onlineMod, hasUpdate: false})
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function checks for updates for all given mods
  * @param {Object[]} mods the mods you want to update
  * @param {string} mods[].name the name of the mod
  * @param {string} mods[].version the version you have installed
  * @param {string} [factorioVersion=this.gameVersion] the version of the game
  * @returns {Promise.<Object[]>} returns an array of all objects returned by checkUpdate
  */
  static checkUpdates(mods, factorioVersion = this.gameVersion) {
    let promises = mods.map((mod) => this.checkUpdate(mod, factorioVersion))
    return Promise.all(promises)
  }

  /**
  * This function downloads a mod
  * @param {Object} mod the mod you want to download
  * @param {string} mod.name the name of the mod
  * @param {string} mod.version the version you want to download (optional, default is latest)
  * @param {string} [factorioVersion=this.gameVersion] the version of the game
  * @returns {Promise.<Object>} returns the online mod information if resolved
  * @see {@link https://wiki.factorio.com/Mod_Portal_API#Result_Entry|Factorio Wiki}
  */
  static downloadMod(mod) {
    return new Promise((resolve, reject) => {
      this.getMod(mod.name).then((onlineMod) => {
        let release

        if (mod.version) {
          release = onlineMod.releases.find(x => x.version == mod.version)
        } else {
          release = onlineMod.releases[0]
        }

        this.downloadModFromUrl(release.download_url).then(() => {
          resolve(onlineMod)
        }).catch((err) => {
          reject(err)
        })
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function downloads mods
  * @param {Object} mods the mods you want to download
  * @param {string} mods[].name the name of the mod
  * @param {string} mods[].version the version you want to download (optional, default is latest)
  * @param {string} [factorioVersion=this.gameVersion] the version of the game
  * @returns {Promise.<Object[]>} returns array of online mods if resolved
  * @see {@link https://wiki.factorio.com/Mod_Portal_API#Result_Entry|Factorio Wiki}
  */
  static downloadMods(mods) {
    let promises = mods.map(mod => this.downloadMod(mod))
    return Promise.all(promises)
  }

  /**
  * This function downloads a mod from a url
  * @param {string} url the download_url of a release (example: /api/downloads/data/mods/id/name_version.zip)
  * @returns {Promise.<string>} returns name of the mod if resolved
  * @see {@link https://wiki.factorio.com/Mod_Portal_API#Releases|Factorio Wiki}
  */
  static downloadModFromUrl(url) {
    return new Promise((resolve, reject) => {
      let fullUrl = 'https://mods.factorio.com' + url + `?username=${this.username}&token=${this.token}`
      let fileName = url.substr(url.lastIndexOf('/') + 1);
      let name = fileName.replace(fileName.substr(fileName.lastIndexOf('_')), '')

      progress(request(fullUrl))
      .on('error', (err) => {
          reject(err)
      })
      .on('end', () => {
        if (!this.allowMultipleVersions) {
          jetpack.findAsync(this.modPath, { matching: `${name}_*.zip`}).then((files) => {
            let promises = []

            files.forEach((file) => {
              if (path.basename(file) != fileName) {
                promises.push(jetpack.removeAsync(file))
              }
            })

            Promise.all(promises).then(() => {
              resolve(name)
            }).catch((err) => {
              reject(err)
            })
          })
        } else {
          resolve(name)
        }
      })
      .pipe(jetpack.createWriteStream(path.join(this.modPath, fileName)))
    })
  }

  /**
  * This function removes all mod zip files matching a glob pattern (relative to mod path)
  * @param {Object} mod the mod you want to remove
  * @param {string} mod.name the name of the mod, can be a glob pattern
  * @param {string} mod.version the version you want to remove, can be a glob pattern too (optional, if not specified, all versions will be removed)
  * @returns {Promise} resolves if successful
  */
  static removeModsMatching(mod) {
    return new Promise((resolve, reject) => {
      let promises = []

      if (!mod.version) {
        mod.version = "*"
      }

      jetpack.findAsync(this.modPath, { matching: `${mod.name}_${mod.version}.zip`}).then((files) => {
        files.forEach((file) => {
          promises.push(jetpack.removeAsync(file))
        })
      })

      Promise.all(promises).then(() => {
        resolve()
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function removes all mod zip files from the mods in the array
  * @param {Object[]} mods the mods you want to remove
  * @param {string} mod[].name the name of the mod, can be a glob pattern
  * @param {string} mod[].version the version you want to remove, can be a glob pattern too (optional, if not specified, all versions will be removed)
  * @returns {Promise} resolves if successful
  */
  static removeMods(mods) {
    return Promise.all(mods.map(mod => this.removeModsMatching(mod)))
  }

  /**
  * This function downloads all dependencies for a mod
  * @param {Object} mod the mod
  * @param {string} mod.name the name of the mod
  * @param {boolean} [optionalMods=false] set to true if you want to download all optional mods (I don't know why you would ever want to do that, but you can!)
  * @returns {Promise.<Object>} returns all online mods if resolved
  */
  static downloadDependencies(mod, optionalMods = false) {
    return new Promise((resolve, reject) => {
      this.getDependencies(mod, optionalMods).then((dependencies) => {
        return this.downloadMods(dependencies)
      }).then((mods) => {
        resolve(mods)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function gets all dependencies for a mod
  * @param {Object} mod the mod
  * @param {string} mod.name the name of the mod
  * @param {boolean} [optionalMods=false] set to true if you want to download all optional mods (I don't know why you would ever want to do that, but you can!)
  * @returns {Promise.<Object[]>} returns array of mods with their name as property ([{name: name_of_the_mod}]) if resolved
  */
  static getDependencies(mod, optionalMods = false) {
    return new Promise((resolve, reject) => {
      this.getMod(mod.name).then((onlineMod) => {
        let release

        if (mod.version) {
          release = onlineMod.releases.find(x => x.version == mod.version)
        } else {
          release = onlineMod.releases[0]
        }

        let dependencies = release.info_json.dependencies

        if (!optionalMods) {
          // Ignore "base" and dependencies that start with "?"
          dependencies = dependencies.filter(x => x[0] != "?" && x.substring(0, 4) != "base")
        } else {
          dependencies = dependencies.map(x => {
            if (x[0] == "?") {
              // Remove "? "
              return x.substring(2)
            } else {
              return x
            }
          })

          // Ignore "base"
          dependencies = dependencies.filter(x => x.substring(0, 4) != "base")
        }

        // Ignore version number, only look at name and create object with name
        dependencies = dependencies.map(x => { return {name: x.split(" ")[0]}})
        resolve(dependencies)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function gets all available online games
  * @returns {Promise.<Object>} returns result of the request (https://multiplayer.factorio.com/get-games?username=<your_username>&token=<your_token>)
  * @see {@link https://wiki.factorio.com/Matchmaking_API#get-games|Factorio Wiki}
  */
  static getGames() {
    let options = {
        method: 'GET',
        uri: 'https://multiplayer.factorio.com/get-games',
        qs: {
            username: this.username,
            token: this.token
        },
        json: true
    }

    return rp(options)
  }

  /**
  * This function gets details of a game
  * @param {string} gameId the id of an online game (get it from getGames())
  * @returns {Promise.<Object>} returns result of the request (https://multiplayer.factorio.com/get-games?username=<your_username>&token=<your_token>)
  * @see {@link https://wiki.factorio.com/Matchmaking_API#get-game-details|Factorio Wiki}
  */
  static getGameDetails(gameId) {
    let options = {
        method: 'GET',
        uri: `https://multiplayer.factorio.com/get-game-details/${gameId}`,
        json: true
    }

    return rp(options)
  }

  /**
  * This function gets mods from a save file
  * @param {string} fileName name of the file, with .zip (relative to save path)
  * @param {boolean} [includeFileName=false] if set to false, an array with all mods will be returned (mod is an object with name and version). If set to true, it will return an object with a name property and a mods property resolve({name: name_of_save, mods: mods})
  * @returns {Promise.<Object>}
  */
  static getModsFromSaveFile(fileName, includeFileName = false) {
    return new Promise((resolve, reject) => {
      let file = path.join(this.savePath, fileName)
      jetpack.readAsync(file, 'buffer').then((buf) => {
        JSZip.loadAsync(buf)
        .then((zip) => {
          return zip.file(/level-init\.dat/)[0].async('nodebuffer')
        })
        .then((buffer) => {
          let mods = []
          let modCount = buffer.readUIntBE(48, 1)
          for (var i = modCount, pos = 52; i > 0; i--) {
            let length = buffer.readUIntBE(pos, 1)

            let modName = buffer.toString('utf-8', pos, pos + length + 2).trim()
            let vMajor = buffer.readUIntBE(pos + length + 1, 1)
            let vMinor = buffer.readUIntBE(pos + length + 2, 1)
            let vPatch = buffer.readUIntBE(pos + length + 3, 1)

            let fullVersion = 'v' + vMajor + '.' + vMinor + '.' + vPatch

            // Remove non-ASCII characters
            modName = modName.replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '')

            mods.push({name: modName, version: fullVersion})

            pos += length + 4
          }

          if (includeFileName) {
            resolve({name: fileName.replace('.zip', ''), mods: mods})
          } else {
            resolve(mods)
          }
        })
        .catch((err) => {
          reject(err)
        })
      })
    })
  }

  /**
  * This function gets mods from a save file
  * @param {string} saveName name of the save, without .zip (relative to save path)
  * @param {boolean} [includeFileName=false] if set to false, an array with all mods will be returned (mod is an object with name and version). If set to true, it will return an object with a name property and a mods property resolve({name: name_of_save, mods: mods})
  * @returns {Promise.<Object>}
  */
  static getModsFromSave(saveName, includeFileName = false) {
    let fileName = `${saveName}.zip`
    return this.getModsFromSaveFile(fileName, includeFileName)
  }

  /**
  * This function gets mods from all save files
  * @returns {Promise.<Object[]>} see docs for getModsFromSave for more info, includeFileName is always true (otherwise it would be confusing)
  */
  static getModsFromSaves() {
    return new Promise((resolve, reject) => {
      jetpack.findAsync(this.savePath, { matching: '*.zip' }).then((files) => {
        Promise.all(files.map(x => this.getModsFromSaveFile(path.basename(x), true))).then((list) => {
          resolve(list)
        }).catch((err) => {
          reject(err)
        })
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function reads info.json from a zip file of a mod
  * @param {string} fileName name of the mod, with .zip (relative to mod path)
  * @returns {Promise.<Object>} returns parsed info.json file if resolved
  */
  static readModZipFile(fileName) {
    return new Promise((resolve, reject) => {
      let file = path.join(this.modPath, fileName)
      jetpack.readAsync(file, 'buffer')
      .then((buffer) => {
        JSZip.loadAsync(buffer)
        .then((zip) => {
          return zip.file(/info\.json/)[0].async('text')
        })
        .then((data) => {
          data = JSON.parse(data)
          resolve(data)
        })
        .catch((err) => {
          reject(err)
        })
      })
      .catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function reads info.json from a zip file of a mod
  * @param {Object} mod the mod you want to get info.json from
  * @param {string} mod.name name of the mod
  * @param {string} mod.version verison of the mod
  * @returns {Promise.<Object>} returns parsed info.json file if resolved
  */
  static readModZip(mod) {
    let fileName = `${mod.name}_${mod.version}.zip`
    return readModZipFile(fileName)
  }

  /**
  * This function reads info.json from all zip files in mod path
  * @returns {Promise.<Object[]>} returns array of parsed info.json files (sorted alphabetically) if resolved
  */
  static readModZips() {
    return new Promise((resolve, reject) => {
      jetpack.findAsync(this.modPath, { matching: '*_*.zip' }).then((files) => {
        Promise.all(files.map(x => this.readModZipFile(path.basename(x)))).then((list) => {
          list = list.sort((a, b) => a.name.localeCompare(b.name))
          resolve(list)
        }).catch((err) => {
          reject(err)
        })
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function reads info.json from all zip files in mod path and applies information from mod-list.json to it (enabled or disabled)
  * @returns {Promise.<Object[]>} returns array of parsed info.json files (sorted alphabetically) with enabled property if resolved
  */
  static loadInstalledMods() {
    return new Promise((resolve, reject) => {
      this.readModZips().then((list) => {
        if (!jetpack.exists(path.join(this.modPath, 'mod-list.json'))) {
          jetpack.write(path.join(this.modPath, 'mod-list.json'), {mods: []})
        }
        jetpack.readAsync(path.join(this.modPath, 'mod-list.json'), 'json').then((modListJson) => {
          list = list.map(mod => {
            let jsonMod = modListJson.mods.find(x => x.name == mod.name)
            if (jsonMod) {
              mod.enabled = (jsonMod.enabled == 'true')
            } else {
              mod.enabled = true
            }
            return mod
          })
          list = list.sort((a, b) => a.name.localeCompare(b.name))
          resolve(list)
        }).catch((err) => {
          reject(err)
        })
      }).catch((err) => {
        reject(err)
      })
    })
  }
  
  /**
  * This function gets the names and versions of the mods in the mods folder
  * @returns {Promise.<Object[]>} returns array of objects with name and version of each mod
  */
  static getInstalledMods() {
    return new Promise((resolve, reject) => {
      jetpack.findAsync(this.modPath, { matching: '*_*.zip' }).then((files) => {
        let nameArr = files.map(file => ({
          name: file.substring(file.indexOf("/") + 1, file.lastIndexOf("_")),
          version: file.substring(file.lastIndexOf("_") + 1, file.lastIndexOf(".zip"))
        }))
        resolve(nameArr)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  /**
  * This function saves the mod list
  * @param {Object[]} mods all the installed mods
  * @param {string} mods[].name name of the mod
  * @param {string} mods[].enabled enabled property of the mod
  * @returns {Promise}
  */
  static saveModList(mods) {
    mods = mods.map(mod => {return {name: mod.name, enabled: mod.enabled.toString()}})
    return jetpack.writeAsync(path.join(this.modPath, 'mod-list.json'), JSON.stringify({mods: mods}))
  }
}

module.exports = FactorioAPI
