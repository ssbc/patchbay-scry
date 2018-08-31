const { h, computed, resolve } = require('mutant')

module.exports = function PickTimes ({ state, prev, next }) {
  const nextBtn = computed(state, ({ title, closesAt }) => {
    var opts = (!title || !closesAt)
      ? { disabled: 'disabled' }
      : { className: '-primary', 'ev-click': next }

    return h('button', opts, 'Next')
  })

  return h('ScryNewInvoke', [
    h('h1', 'Scry invocation'),
    h('div.details', [
      h('label.closes-at', 'Title'),
      h('input',
        {
          placeholder: 'Name of gathering you\'re scrying for',
          'ev-input': ev => {
            state.title.set(ev.target.value)
          }
        },
        state.title
      ),
      h('label.closes-at', 'Closes'),
      h('div.closes-at', [
        h('div.closes-at-helper', prettyTime(state.closesAt)),
        h('button', { 'ev-click': () => shiftClosesAt(-6) }, '-'),
        h('button', { 'ev-click': () => shiftClosesAt(+6) }, '+')
      ])
    ]),
    h('div.actions', [
      prev ? h('button', { 'ev-click': prev }, 'Cancel') : null,
      next ? nextBtn : null
    ])
  ])

  function prettyTime (obsTime) {
    return computed(obsTime, d => {
      const day = d.toDateString().slice(0, 10)
      const time = d.toLocaleTimeString().slice(0, 5)
      return `${day}, ${time}`
    })
  }

  function shiftClosesAt (delta) {
    const newClosesAt = new Date(resolve(state.closesAt))
    newClosesAt.setHours(newClosesAt.getHours() + delta)
    if (newClosesAt < new Date()) return

    state.closesAt.set(newClosesAt)
  }
}
