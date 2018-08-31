const nest = require('depnest')
const { h } = require('mutant')
const Scuttle = require('scuttle-poll')

const ScryNew = require('../../../views/new')

exports.gives = nest({
  'app.page.scryNew': true
})

exports.needs = nest({
  // 'about.html.avatar': 'first',
  // 'app.html.modal': 'first',
  'app.sync.goTo': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'app.page.scryNew': scryNewPage
  })

  function scryNewPage (location) {
    const scuttle = Scuttle(api.sbot.obs.connection)

    const page = h('Scry -new', { title: '/scry/new' }, [
      ScryNew({
        scuttle,
        afterPublish: (msg) => api.app.sync.goTo(msg)
      })
    ])

    page.scroll = () => {} // stops keyboard shortcuts from breaking
    return page
  }
}
