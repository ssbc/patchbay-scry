const nest = require('depnest')
const { h } = require('mutant')
const Scuttle = require('scuttle-poll')

const ScryIndex = require('../../../views/index')

exports.gives = nest({
  'app.html.menuItem': true,
  'app.page.scryIndex': true
})

exports.needs = nest({
  // 'about.html.avatar': 'first',
  // 'app.html.modal': 'first',
  // 'about.async.suggest': 'first',
  // 'about.html.avatar': 'first',
  // 'keys.sync.id': 'first'
  'app.sync.goTo': 'first',
  'message.html.markdown': 'first',
  'sbot.obs.connection': 'first',
  'scry.html.button': 'first'
})

exports.create = function (api) {
  return nest({
    'app.html.menuItem': menuItem,
    'app.page.scryIndex': scryIndexPage
  })

  function menuItem () {
    return h('a', {
      'ev-click': () => api.app.sync.goTo('/scry')
    }, '/scry')
  }

  function scryIndexPage (location) {
    const page = h('Scry -index', { title: '/scry' }, [
      ScryIndex({
        scuttle: Scuttle(api.sbot.obs.connection),
        mdRenderer: api.message.html.markdown,
        showScry: api.app.sync.goTo,
        newScryButton: api.scry.html.button
      })
    ])

    page.scroll = () => {} // stops keyboard shortcuts from breaking
    return page
  }
}
