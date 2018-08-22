const nest = require('depnest')
const { h } = require('mutant')
// const Scuttle = require('scuttle-dark-crystal')
const getContent = require('ssb-msg-content')

const ScryShow = require('../../../views/show')

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
    const scuttle = Scuttle(api.sbot.obs.connection)
    const { title } = getContent(location)

    const page = h('Scry -show', { title: `/scry — ${name}` }, [
      h('h1', ['Scry', h('i.fa.fa-diamond')]),
    ])

    page.scroll = () => {} // stops keyboard shortcuts from breaking
    return page
  }
}
