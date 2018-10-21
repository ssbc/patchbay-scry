const { h, computed } = require('mutant')
const Recipients = require('../component/recipients')

module.exports = function AddMentions ({ state, prev, next, myKey, suggest, avatar }) {
  const nextBtn = computed(state, ({ body }) => {
    var opts = (!body)
      ? { disabled: 'disabled' }
      : { className: '-primary', 'ev-click': next }

    return h('button', opts, 'Scry')
  })
  return h('ScryAddMentions', [
    h('h1', computed(state.title, title => `Add Description and Invite to ${title}`)),
    h('div.details', [
      h('label.closes-at', 'Description'),
      h('textarea',
        {
          placeholder: '',
          'ev-input': ev => {
            state.body.set(ev.target.value)
          }
        },
        state.body
      ),
      h('label', 'Recipients'),
      Recipients({ state, myKey, suggest, avatar })
    ]),
    h('div.actions', [
      prev ? h('button', { 'ev-click': prev }, 'Cancel') : null,
      next ? nextBtn : null
    ])
  ])
}
