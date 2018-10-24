const { h } = require('mutant')
const Recipients = require('../component/recipients')

module.exports = function AddMentions ({ state, prev, next, myKey, suggest, avatar }) {
  return h('ScryAddMentions', [
    h('h1', title => 'Invite friends (Optional)'),
    h('div.details', [
      h('label', 'If you\'d like to make sure particular friends see this, you can list them here and this scry will show up in their mentions / notifications'),
      Recipients({ state, myKey, suggest, avatar })
    ]),
    h('div.actions', [
      prev ? h('button', { 'ev-click': prev }, 'Back') : null,
      next ? h('button', { 'ev-click': next }, 'Publish') : null
    ])
  ])
}
