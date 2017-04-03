import rp from 'request-promise'
import semver from 'semver';
const jetpack = require('fs-jetpack');
const download = require('download');
const path = require('path');

class FactorioAPI {
  constructor(modPath, allowMultipleVersions = false) {
    this.token = null
    this.username = null
    this.modPath = modPath
    this.allowMultipleVersions = allowMultipleVersions
  }

  // ------------------------
  // Authenication with username and password/token
  authenticate(props) {
    return new Promise((resolve, reject) => {
      props.require_ownership = typeof props.require_ownership !== 'undefined' ? props.require_ownership : false
      if (props.username && props.token) {
        this.token = props.token
        this.username = props.username
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
          resolve(body[0])
        }).catch((err) => {
          reject(err)
        })
      } else {
        reject("Error: Insufficient information")
      }
    })
  }

  // ------------------------
  // Mod Portal
  // More information: https://wiki.factorio.com/Mod_Portal_API
  getMod(name) {
    return new Promise((resolve, reject) => {
      let options = {
          method: 'GET',
          uri: `https://mods.factorio.com/api/mods/${name}`,
          json: true
      }

      rp(options).then((body) => {
        if (body.detail === 'Not found.') {
          reject('Error: Mod not found')
        } else {
          resolve(body)
        }
      }).catch((err) => {
        reject(err)
      })
    })
  }

  searchMods(props) {
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

  // ------------------------
  // mods = [{name: {name}, version: {current version}}]
  updateMods(mods) {
    let promises = mods.map((mod) => {
      return this.updateMod(mod)
    })

    return Promise.all(promises)
  }

  // ------------------------
  /*
  mod = {
    name: {name},
    version: {current version}
  }
  */
  updateMod(mod) {
    return new Promise((resolve, reject) => {
      this.getMod(mod.name).then((onlineMod) => {
        let current = mod.version
        let latest = onlineMod.releases[0].version
        if (semver.gt(latest, current)) {
          console.log(mod.name + ": Update available: " + current + " --> " + latest);
          this.downloadModFromUrl(onlineMod.releases[0].download_url).then(() => {
            resolve()
          })
        } else {
          console.log(mod.name + ": Up-to-date");
          resolve()
        }
      }).catch((err) => {
        reject(err)
      })
    })
  }

  // ------------------------
  // mods = [{name: {name}, version: {version you want to download}}]
  downloadMods(mods) {
    let promises = mods.map((mod) => {
      return this.downloadMod(mod)
    })

    return Promise.all(promises)
  }

  // ------------------------
  /*
  mod = {
    name: {name},
    version: {version you want to download}
  }
  */
  downloadMod(mod) {
    return new Promise((resolve, reject) => {
      this.getMod(mod.name).then((onlineMod) => {
        let release

        if (mod.version) {
          release = onlineMod.releases.find(x => x.version == mod.version)
        } else {
          release = onlineMod.releases[0]
        }

        this.downloadModFromUrl(release.download_url).then(() => {
          resolve()
        })
      }).catch((err) => {
        reject(err)
      })
    })
  }

  // ------------------------
  // url = {download_url property from release}
  // (example: /api/downloads/data/mods/id/name_version.zip)
  downloadModFromUrl(url) {
    return new Promise((resolve, reject) => {
      let fullUrl = 'https://mods.factorio.com' + url + `?username=${this.username}&token=${this.token}`
      let fileName = url.substr(url.lastIndexOf('/') + 1);
      let name = fileName.replace(fileName.substr(fileName.lastIndexOf('_')), '')

      download(fullUrl).then(data => {
        jetpack.writeAsync(path.join(this.modPath, fileName), data).then(() => {
          if (!this.allowMultipleVersions) {
            jetpack.findAsync(this.modPath, { matching: `${name}_*.zip`}).then((files) => {
              let promises = []

              files.forEach((file) => {
                if (path.basename(file) != fileName) {
                  promises.push(jetpack.removeAsync(file))
                }
              })

              Promise.all(promises).then(() => {
                resolve()
              })
            })
          } else {
            resolve()
          }
        })
      }).catch((err) => {
        reject(err)
      })
    })
  }
}

export default FactorioAPI
