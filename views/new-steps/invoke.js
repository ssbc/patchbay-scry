const { h, computed } = require('mutant')

module.exports = function PickTimes ({ state, prev, next }) {
  const nextBtn = computed(state.title, title => {
    var opts = !title
      ? { disabled: 'disabled' }
      : { className: '-primary', 'ev-click': next }

    return h('button', opts, 'Next')
  })

  return h('ScryNewInvoke', [
    h('h1', 'New Scry'),
    h('div.details', [
      h('input',
        {
          placeholder: 'Title',
          'ev-input': ev => {
            state.title.set(ev.target.value)
          }
        },
        state.title
      )
    ]),
    h('div.actions', [
      prev ? h('button', { 'ev-click': prev }, 'Cancel') : null,
      next ? nextBtn : null
    ])
  ])
}
