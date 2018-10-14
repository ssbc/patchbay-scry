const { h, computed } = require('mutant')
const Recipients = require('../component/recipients')

module.exports = function AddMentions ({ state, prev, next, myKey, suggest, avatar }) {
  const nextBtn = computed(state, ({ description }) => {
    var opts = (!description)
      ? { disabled: 'disabled' }
      : { className: '-primary', 'ev-click': next }

    return h('button', opts, 'Next')
  })
  return h('ScryAddMentions', [
    h('h1', computed(state.title, title => `Add Description and Invite to ${title}`)),
    h('div.details', [
      h('label.closes-at', 'Description'),
      h('textarea',
        {
          placeholder: '',
          'ev-input': ev => {
            state.description.set(ev.target.value)
          }
        },
        state.description
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
