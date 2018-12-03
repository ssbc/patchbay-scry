const { parseChooseOnePoll, parseMeetingTimePoll, isPoll } = require('ssb-poll-schema')
const { h } = require('mutant')

module.exports = function ScryCard ({ scuttle, msg, mdRenderer, onClick }) {
  var content
  if (isPoll.chooseOne(msg)) content = parseChooseOnePoll(msg)
  else if (isPoll.meetingTime(msg)) content = parseMeetingTimePoll(msg)
  else return

  const { title, body, closesAt: closesAtString } = content

  const closesAt = new Date(closesAtString)
  const date = closesAt.toDateString()
  const [ , time, zone ] = closesAt.toTimeString().match(/^(\d+:\d+).*(\([+-\w\s\d]+\))$/)

  return h('ScryCard', { className: 'Markdown', 'ev-click': onClick }, [
    h('h1', title),
    h('div.body', mdRenderer(body || '')),
    h('div.closesAt', [
      'closes at: ',
      `${time},  ${date} ${zone}`
    ])
  ])
}
