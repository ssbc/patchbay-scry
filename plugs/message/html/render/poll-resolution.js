const { h, Value, Array: MutantArray, map } = require('mutant')
const nest = require('depnest')
const Scuttle = require('scuttle-poll')
const isPoll = require('scuttle-poll/isPoll')

exports.gives = nest('message.html.render')

exports.needs = nest({
  'app.sync.goTo': 'first',
  'message.html.decorate': 'reduce',
  'message.html.layout': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = (api) => {
  return nest('message.html.render', scryResolution)

  function scryResolution (msg) {
    if (!isPoll.resolution(msg)) return

    const { root } = msg.value.content
    const title = Value()
    const type = Value('Poll')
    const choices = MutantArray([])

    const scuttle = Scuttle(api.sbot.obs.connection)
    scuttle.poll.async.get(root, (err, data) => {
      if (err) return console.error(err)

      const _choices = data.resolution.choices
        .map(c => data.value.content.details.choices[c])

      title.set(data.title)

      if (data.type === 'meetingTime') {
        const times = _choices.map(t => new Date(t).toLocaleString())
        choices.set(times)
        type.set('Scry')
      } else {
        choices.set(_choices)
      }
    })

    const content = h('div',
      { 'ev-click': () => api.app.sync.goTo(root) },
      [
        h('strong', [ h('i.fa.fa-check-square-o'), ' ', type, ' resolved: ' ]),
        h('a', { href: '#' }, title),
        h('ul', map(choices, choice => h('li', choice)))
      ]
    )

    return api.message.html.decorate(
      api.message.html.layout(msg, { content, layout: 'default' }),
      { msg }
    )
  }
}
