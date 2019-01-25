const nest = require('depnest')
const { h } = require('mutant')
const Scuttle = require('scuttle-poll')
const getContent = require('ssb-msg-content')

const Show = require('../../../views/show')

exports.gives = nest({
  'app.page.scryShow': true,
  'gathering.sync.launchModal': true // dummy entry
})

exports.needs = nest({
  'about.html.avatar': 'first',
  'about.obs.name': 'first',
  'gathering.sync.launchModal': 'first',
  'keys.sync.id': 'first',
  'message.html.markdown': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'app.page.scryShow': scryShowPage,
    'gathering.sync.launchModal': () => {}
  })

  function scryShowPage (poll) {
    const scry = Show({
      poll,
      myFeedId: api.keys.sync.id(),
      scuttle: Scuttle(api.sbot.obs.connection),
      name: api.about.obs.name,
      avatar: api.about.html.avatar,
      mdRenderer: api.message.html.markdown,
      NewGathering: api.gathering.sync.launchModal
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
