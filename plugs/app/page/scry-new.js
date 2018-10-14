const nest = require('depnest')
const { h } = require('mutant')
const Scuttle = require('scuttle-poll')

const ScryNew = require('../../../views/new')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.scryNew': true
})

exports.needs = nest({
  // 'about.html.avatar': 'first',
  // 'app.html.modal': 'first',
  'app.sync.goTo': 'first',
  'sbot.obs.connection': 'first',
  'about.async.suggest': 'first',
  'about.html.avatar': 'first',
  'keys.sync.id': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.scryNew': scryNewPage
  })

  function menuItem () {
    return h('a', {
      'ev-click': () => api.app.sync.goTo('/scry/new')
    }, '/scry/new')
  }

  function scryNewPage (location) {
    const scuttle = Scuttle(api.sbot.obs.connection)

    const page = h('Scry -new', { title: '/scry/new' }, [
      ScryNew({
        scuttle,
        afterPublish: (msg) => api.app.sync.goTo(msg),
        myKey: api.keys.sync.id(),
        avatar: api.about.html.avatar,
        suggest: { about: api.about.async.suggest }
      })
    ])

    page.scroll = () => {} // stops keyboard shortcuts from breaking
    return page
  }
}
