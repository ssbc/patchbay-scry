const { h, Value, computed } = require('mutant')
const Scroller = require('mutant-scroll')
const pull = require('pull-stream')
const { meetingTime: isScry } = require('scuttle-poll/isPoll')

const ScryCard = require('./component/scry-card')

const OPEN = 'open'
const CLOSED = 'closed'
const ALL = 'all'
const MINE = 'mine'

module.exports = function scryIndex (opts) {
  const {
    scuttle,
    mdRenderer = (text) => text,
    showScry,
    newScryButton = null
  } = opts

  var mode = Value(OPEN)

  const prepend = [
    h('div.show', [
      FilterButton(OPEN),
      FilterButton(CLOSED),
      FilterButton(ALL),
      FilterButton(MINE)
    ]),
    newScryButton
  ]

  const scrys = computed(mode, mode => {
    return Scroller({
      prepend,
      streamToTop: createStream(mode, { old: false, live: true }),
      streamToBottom: createStream(mode, { reverse: true, live: false }),

      render: (msg) => {
        const onClick = () => showScry(msg)
        return ScryCard({ scuttle, msg, mdRenderer, onClick })
      },
      overflowY: 'auto'
    })
  })

  const page = h('ScryIndex', [
    scrys
  ])

  page.title = '/scry'
  return page

  // helpers

  function FilterButton (m) {
    const term = m === 'mine' ? 'participated' : m
    // TODO better i18n!

    return h('button', {
      'ev-click': () => mode.set(m),
      className: computed(mode, mode => m === mode ? '-primary' : '')
    }, term)
  }

  function createStream (mode, opts) {
    return pull(
      scuttle.poll.pull[mode](opts),
      pull.filter(isScry),
      pull.through(m => {
        if (m.value.content.details.type !== 'meetingTime' && isScry(m)) debugger
      })
    )
  }
}
