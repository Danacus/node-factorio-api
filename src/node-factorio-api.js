import rp from 'request-promise'
import semver from 'semver'
import jetpack from 'fs-jetpack'
import path from 'path'
import JSZip from 'jszip'
import request from 'request'
import progress from 'request-progress'
import cheerio from 'cheerio'
import ProgressPromise from 'progress-promise'
import uuidv4 from 'uuid/v4'

class FactorioAPI {
  /**
 * This function initializes the api.
 * @param {boolean} [allowMultipleVersions=false]
 * @param {string} [modPath=''] path to the mods folder
 * @param {string} [savePath=''] path to the saves folder
 * @param {string} [gameVersion='0.0.0'] the version of the game
 */
  static init(allowMultipleVersions = false, modPath = '', savePath = '', downloadPath = '', gameVersion = "0.0.0") {
    this.token = null
    this.username = null
    this.modPath = modPath
    this.savePath = savePath
    this.downloadPath = downloadPath
    this.gameVersion = gameVersion
    this.allowMultipleVersions = allowMultipleVersions
    this.authenticated = false
    this.sessionId = ''
    this.cookieJar = request.jar()
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
    return this.authenticated;
  }

  /**
 * This function authenticates with a username and password or token, it also downloads and chaches the mod list
 * @param {Object} props The properties for authentication
 * @param {string} props.username The username
 * @param {string} props.password Not recommended, use token instead, but password is required for downloading the Factorio client, unless you manually provide a session id
 * @param {string} props.token The player token, can be found in player-data.json
 * @param {string} props.sessionId Only if you want to download the Factorio client, but you are to paranoid to type your password. You can get this session id by logging in with your browser on factorio.com. You will be able to find a session id in the cookies, by using the devtools of your browser.
 * @returns {Promise} returns a promise
 */
  static authenticate(props) {
    return new Promise((resolve, reject) => {
      if (props.username && props.token) {
        this.token = props.token
        this.username = props.username
        this.authenticated = true
        resolve();
        return this.reloadCache()
      } else if (props.username && props.password) {
        this.authenticateAPI(props.username, props.password).then((body) => {
          this.username = props.username;
          this.token = body[0];
          this.authenticated = true;
          return this.getCSRFToken();
        }).then(token => {
          return this.authenticateWeb(props.username, props.password, token);
        }).then((res) => {
          this.sessionId = this.cookieJar.getCookieString('https://www.factorio.com/');
          return this.reloadCache();
        }).then(() => {
          resolve();
        }).catch((err) => {
          reject(err);
        })
      } else if (props.sessionId) {
        this.sessionId = props.sessionId;
        resolve();
      } else {
        reject("Error: Insufficient information");
      }
    })
  }

  static authenticateAPI(username, password) {
    let apiAuthOptions = {
      method: 'POST',
      uri: 'https://auth.factorio.com/api-login',
      qs: {
        username: username,
        password: password,
        require_ownership: true
      },
      json: true
    };

    return rp(apiAuthOptions)
  }

  static getCSRFToken() {
    let getCSRFOptions = {
      method: 'GET',
      uri: 'https://www.factorio.com/login',
      resolveWithFullResponse: true,
      jar: this.cookieJar,
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded'
      },
    };

    return rp(getCSRFOptions).then(res => {
      let $ = cheerio.load(res.body);
      return $('input[name=csrf_token]').val();
    });
  }

  static authenticateWeb(username, password, token) {
    let authOptions = {
      method: 'POST',
      url: `https://www.factorio.com/login`,
      form: {
          csrf_token: token,
          username_or_email: username,
          password: password
      },
      headers: {
        'Content-Type' : 'application/x-www-form-urlencoded'
      },
      jar: this.cookieJar,
      resolveWithFullResponse: true ,
      followAllRedirects: true
    }
    return rp(authOptions);
  }

  /** 
   * This function reloads the local cache file with a list of all the available mods
  */
  static reloadCache() {
    return new Promise((resolve, reject) => {
      let options = {
          method: 'GET',
          uri: `https://mods.factorio.com/api/mods`,
          qs: {
            page_size: 1000000
          },
          json: true
      };

      rp(options).then(body => {
        return jetpack.writeAsync('mod_cache.json', JSON.stringify(body));
      }).then(() => {
       resolve() 
      }).catch((err) => {
        reject(err)
      });
    });
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
  * @param {string} query A search query
  * @returns {Promise.<Object>} returns a filtered array with results, sorted from most downloads to least downloads
  */
  static searchMods(query) {
    return new Promise((resolve, reject) => {
      this.checkCache().then(() => {
        return jetpack.readAsync('mod_cache.json', 'json')
      }).then((body) => {
        let valid = body.results.filter(result => result.name && result.title)
        let results = valid.filter(result => result.name.toUpperCase().includes(query.toUpperCase()))
        results = results.sort((a, b) => b.downloads_count - a.downloads_count);
        resolve(results)
      }).catch((err) => {
        reject(err)
      })
    })
  }

  static checkCache() {
    return new Promise((resolve, reject) => {
      jetpack.existsAsync('mod_cache.json').then(res => {
        if (res) {
          resolve();
        } else {
          this.reloadCache().then(() => {
            resolve();
          })
        }
      })
    });
  }

  /**
   * This function can download the game
   * @param {Object} props properties of the file you want to download 
   * @param {string} props.version the version of the game, use 'latest' to get the latest experimental version
   * @param {string} props.build the release build, choose between 'alpha', 'demo' and 'headless'. 'alpha' is the standard full-featured build
   * @param {string} props.distro your OS and architecture, choose between 'win64', 'win64-manual', 'osx', 'linux64'
   * @returns {ProgressPromise} returns a ProgressPromise, use .progress(percentage => {}) to get the progress and .then(() => {}) to see when the download is completed 
   */
  static downloadGame(props) {
    return new ProgressPromise((resolve, reject, prog) => {
      let filename = 'file';
      let tempname = uuidv4();
  
      progress(request({
        url: `https://factorio.com/get-download/${props.version}/${props.build}/${props.distro}`, 
        headers: {
          'Cookie': this.sessionId,
        },
        jar: this.cookieJar
      }))
        .on('progress', (state) => {
          prog(state.percent)
        })
        .on('error', (err) => {
          reject(err)
        })
        .on('response', (res) => {
          filename = res.headers['content-disposition'].split("filename=")[1];
        })
        .on('end', () => {
          jetpack.rename(path.join(this.downloadPath, tempname + '.temp'), path.join(this.downloadPath, filename));
          resolve();
        })
        .pipe(jetpack.createWriteStream(path.join(this.downloadPath, tempname + '.temp')))
    });
  }

  /**
   * Get the version number of the latest version of the client
   * @param {string} buildType build type, 'stable' or 'experimental' 
   * @returns {Promise.<string>} returns the version number if resolved
   */
  static getLatestGameVersion(buildType) {
    let url = '';
    if (buildType == 'experimental') {
      url = 'https://www.factorio.com/download/experimental';
    } else {
      url = 'https://www.factorio.com/download'
    }

    let options = {
      method: 'GET',
      url,
      headers: {
        'Cookie': this.sessionId,
      },
    };

    return rp(options).then(body => {
      let $ = cheerio.load(body);
      return $('h3').first().text().split('(')[0].trim();
    });
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
          if (release.info_json.factorio_version.split('.').length < 3) {
            release.info_json.factorio_version += '.0'
          }
          if (semver.gt(release.version, mod.version)
            && (semver.minor(release.info_json.factorio_version) == semver.minor(factorioVersion) || factorioVersion == "0.0.0")) {
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
          release = onlineMod.releases.find(x => x.version == mod.version);
        } else {
          release = onlineMod.releases[onlineMod.releases.length - 1];
        }

        this.downloadModFromUrl(release.file_name, release.download_url).then(() => {
          resolve(onlineMod);
        }).catch((err) => {
          reject(err);
        })
      }).catch((err) => {
        reject(err);
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
  * @param {string} fileName the name of the file
  * @param {string} url the download_url of a release (example: /api/downloads/data/mods/id/name_version.zip)
  * @returns {ProgressPromise.<string>} returns name of the mod if resolved
  * @see {@link https://wiki.factorio.com/Mod_Portal_API#Releases|Factorio Wiki}
  */
  static downloadModFromUrl(fileName, url) {
    return new Promise((resolve, reject) => {
      let fullUrl = 'https://mods.factorio.com' + url + `?username=${this.username}&token=${this.token}`
      let name = fileName.replace(fileName.substr(fileName.lastIndexOf('_')), '')

      progress(request(fullUrl))
      .on('progress', (state) => {

      })
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
  * @param {Object} mod the mod you want to get info.json from
  * @param {string} mod.name name of the mod
  * @param {boolean} [optionalMods=false] set to true if you want to download all optional mods (I don't know why you would ever want to do that, but you can!)
  * @returns {Promise.<Object[]>} returns array of mods with their name as property ([{name: name_of_the_mod}]) if resolved
  */
  static getDependencies(mod, optionalMods = false) {
    return new Promise((resolve, reject) => {
      this.readModZipFile(path.basename(jetpack.find(this.modPath, {matching: `${mod.name}_*.zip`})[0])).then((info_json) => {
        let dependencies = info_json.dependencies

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

            let modName = buffer.toString('utf-8', pos + 1, pos + length + 1)
            let vMajor = buffer.readUIntBE(pos + length + 1, 1)
            let vMinor = buffer.readUIntBE(pos + length + 2, 1)
            let vPatch = buffer.readUIntBE(pos + length + 3, 1)

            let fullVersion = 'v' + vMajor + '.' + vMinor + '.' + vPatch

            mods.push({name: modName, version: fullVersion})

            pos += length + 8
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
  * @param {string} mod.version version of the mod
  * @returns {Promise.<Object>} returns parsed info.json file if resolved
  */
  static readModZip(mod) {
    let fileName = `${mod.name}_${mod.version}.zip`
    return this.readModZipFile(fileName)
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
