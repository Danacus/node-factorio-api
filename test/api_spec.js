import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
chai.use(chaiAsPromised)
chai.should()
import api from '../src/node-factorio-api'

describe('init', () => {
  it('initializes with modPath, savePath and game version', () => {
    api.init(false, './mods/', './saves/', '0.14.22')
    api.getGameVersion().should.equal('0.14.22')
    api.getModPath().should.equal('./mods/')
    api.getSavePath().should.equal('./saves/')
    return
  })

  it('rejects if authenticating without token or password', (done) => {
    api.authenticate({username: 'Danacus'})
      .should.be.rejected.notify(done)
  })

  it('authenticates with username and token', (done) => {
    api.authenticate({username: 'Danacus', token: ''})
      .should.be.fulfilled.notify(done)
  })
})

// Not working anymore

/*describe('Searching mods', () => {
  it('gets information from a mod', (done) => {
    api.getMod('Foreman').should.eventually.have.property('releases').notify(done)
  })

  it('rejects with "Mod not found" error', (done) => {
    api.getMod('LolMod').should.be.rejectedWith('404 - {"message":"Mod not found"}').notify(done)
  })

  it('searches mods', (done) => {
    api.searchMods({
      q: 'bob',
      order: 'top',
      page_size: '10'
    }).should.eventually.have.property('results').with.lengthOf(10).notify(done)
  })
}).timeout(10000);*/

describe('Check for updates', () => {
  it('checks for update compatible with current game version', (done) => {
    api.checkUpdate({name: 'Foreman', version: '0.0.1'})
      .should.eventually.have.property('hasUpdate').which.equals(true).notify(done)
  })

  it('gets latest version for current game version', (done) => {
    api.checkUpdate({name: 'Foreman', version: '0.0.1'})
      .should.eventually.have.property('version').which.equals('1.0.0').notify(done)
  })

  it('checks for update compatible with older game version (false when up-to-date)', (done) => {
    api.checkUpdate({name: 'Foreman', version: '0.2.6'}, '0.13.0')
      .should.eventually.have.property('hasUpdate').which.equals(false).notify(done)
  })

  it('gets latest version for older game version', (done) => {
    api.checkUpdate({name: 'Foreman', version: '0.2.5'}, '0.13.0')
      .should.eventually.have.property('version').which.equals('0.2.6').notify(done)
  })
}).timeout(10000);

describe('Downloading mods', () => {
  it('downloads the latest version of a mod', (done) => {
    api.downloadMod({name: 'Foreman'}).should.be.fulfilled.notify(done)
  })

  it('downloads a specified version of a mod', (done) => {
    api.downloadMod({name: 'Foreman', version: '0.2.6'}).should.be.fulfilled.notify(done)
  })

  it('downloads multiple mods', (done) => {
    api.downloadMods([
      {name: 'boblogistics'},
      {name: 'bobmodules'}
    ]).should.be.fulfilled.notify(done)
  })
}).timeout(10000);

describe('Updating mods', () => {
  it('updates the to latest version of a mod for the current game version', (done) => {
    api.updateMod({name: 'Foreman', version: '0.2.6'}).should.be.fulfilled.notify(done)
  })

  it('updates the to latest version of a mod for an older game version', (done) => {
    api.updateMod({name: 'Foreman', version: '0.2.5'}, '0.13.0').should.be.fulfilled.notify(done)
  })

  it('resolves when up-to-date', (done) => {
    api.updateMod({name: 'Foreman', version: '1.1.5'}).should.be.fulfilled.notify(done)
  })
}).timeout(10000);

describe('Removing mods', () => {
  it('removes mods from array', (done) => {
    api.removeMods([{name: 'Foreman', version: '1.1.5'}, {name: 'Foreman', version: '1.1.6'}]).should.be.fulfilled.notify(done)
  })

  it('removes mods from matching a pattern', (done) => {
    api.removeModsMatching({name: 'bobmodu*'}).should.be.fulfilled.notify(done)
  })

  it('removes mods from array (all versions)', (done) => {
    api.removeMods([{name: 'Foreman'}]).should.be.fulfilled.notify(done)
  })
}).timeout(10000);

describe('Downloading dependencies', () => {
  it('downloads dependencies for a mod', (done) => {
    api.downloadDependencies({name: 'boblogistics'}).should.eventually.have.lengthOf(1).notify(done)
  })
}).timeout(10000);

describe('Loading installed mods', () => {
  it('loads installed mods', (done) => {
    api.loadInstalledMods().should.eventually.have.lengthOf(2).notify(done)
  })
}).timeout(10000);

describe('Saving mod list', () => {
  it('saves the mod list', (done) => {
    api.loadInstalledMods().then((installedMods) => {
      api.saveModList(installedMods).should.be.fulfilled.notify(done)
    })
  })
}).timeout(10000);

describe('Loading save file', () => {
  it('loads mods from a save file', (done) => {
    api.getModsFromSave('new game', true).should.eventually.have.property('mods').notify(done)
  })
}).timeout(10000);

describe('Matchmaking', () => {
  it('gets all online games', (done) => {
    api.getGames().should.be.fulfilled.notify(done)
  })

  it('gets details from a game', (done) => {
    api.getGameDetails(437645).should.be.fulfilled.notify(done)
  })
}).timeout(10000);
