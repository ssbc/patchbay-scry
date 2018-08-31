const nest = require('depnest')
const { h } = require('mutant')
// const Scuttle = require('scuttle-poll')
const getContent = require('ssb-msg-content')

// const ScryShow = require('../../../views/show')

exports.gives = nest({
  'app.page.scryShow': true
})

exports.needs = nest({
  // 'about.html.avatar': 'first',
  // 'app.html.modal': 'first',
  // 'app.sync.goTo': 'first',
  // 'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'app.page.scryShow': scryShowPage
  })

  function scryShowPage (location) {
    // const scuttle = Scuttle(api.sbot.obs.connection)
    const { title, details: { choices } } = getContent(location)

    const page = h('Scry -show', { title: `/scry — ${title}` }, [
      h('h1', title),
      choices.map(c => h('div', c))
    ])

    page.scroll = () => {} // stops keyboard shortcuts from breaking
    return page
  }
}
