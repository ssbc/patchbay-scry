const nest = require('depnest')
const { h } = require('mutant')
const Scuttle = require('scuttle-poll')
const getContent = require('ssb-msg-content')

const Show = require('../../../views/show')

exports.gives = nest({
  'app.page.scryShow': true
})

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'keys.sync.id': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'app.page.scryShow': scryShowPage
  })

  function scryShowPage (poll) {
    const scry = Show({
      poll,
      myFeedId: api.keys.sync.id(),
      scuttle: Scuttle(api.sbot.obs.connection),
      name: api.about.obs.name,
      avatar: api.about.html.avatar
    })
    scry.title = ''

    const page = h('Scry -show', [
      scry
    ])
    page.title = getContent(poll).title
    page.scroll = () => {} // stops keyboard shortcuts from breaking
    return page
  }
}
