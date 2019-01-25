const { h, Value } = require('mutant')
const nest = require('depnest')
const Scuttle = require('scuttle-poll')
const isPoll = require('scuttle-poll/isPoll')

exports.gives = nest('message.html.render')

exports.needs = nest({
  'app.sync.goTo': 'first',
  'message.html.decorate': 'reduce',
  'message.html.layout': 'first',
  'sbot.obs.connection': 'first',
  'keys.sync.id': 'first'
})

exports.create = (api) => {
  return nest('message.html.render', scryNotification)

  function scryNotification (msg) {
    if (!isPoll.meetingTime(msg)) return

    const title = Value()

    const myKey = api.keys.sync.id()
    const { mentions = [] } = msg.value.content
    var mentionsMe = mentions
      .map(mention => mention.link || mention)
      .find(link => link === myKey)

    const scuttle = Scuttle(api.sbot.obs.connection)
    scuttle.poll.async.get(msg.key, (err, data) => {
      if (err) return console.error(err)

      title.set(data.title)
    })

    const content = h('div',
      { 'ev-click': () => api.app.sync.goTo(msg) },
      [
        h('strong', [ h('i.fa.fa-calendar'), ' Scry started: ' ]),
        h('a', { href: '#' }, title),
        mentionsMe
          ? h('p', 'You\'ve been invited to participate')
          : null

      ]
    )

    return api.message.html.decorate(
      api.message.html.layout(msg, { content, layout: 'default' }),
      { msg }
    )
  }
}
