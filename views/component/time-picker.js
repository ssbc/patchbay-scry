const { h, computed, Value, when } = require('mutant')

module.exports = function TimePicker ({ times }) {
  return h('ScryTimePicker', [
    computed(times, times => {
      return times
        .map(time => time.date)
        // .sort((a, b) => a - b)
        .map(t => TimeEntry(t, times))
    }),
    NewTimeEntry(times)
  ])
}

function NewTimeEntry (times) {
  var active = Value(false)

  const options = Array(96).fill(0).map((_, i) => {
    var time = new Date()
    time.setHours(0)
    time.setMinutes(15 * i)
    return time
  })
  const DAY_START_SELECTOR = 'day-start'

  const el = h('div.add-more', [
    when(active,
      h('div.dropdown', options.map((time, i) => {
        return h('div',
          {
            'ev-click': () => select(time),
            className: i === 32 ? DAY_START_SELECTOR : ''
          },
          printTime(time)
        )
      }))
    ),
    h('div.add', { 'ev-click': activate }, '+ Add times')
  ])

  return el

  function select (time) {
    if (!times.find(t => t.date === time)) {
      // time not yet selected
      times.push(Event(time))
    }
    active.set(false)
  }

  function activate () {
    active.set(true)

    const target = el.querySelector('.' + DAY_START_SELECTOR)
    target.parentNode.scrollTop = target.offsetTop - target.parentNode.offsetTop + 4
  }
}

function TimeEntry (t, times) {
  return h('div.time-entry', [
    h('div.time', printTime(t)),
    h('div.close', { 'ev-click': () => removeTime(t, times) }, '×')
    // h('i.fa.fa-close')
  ])
}

function printTime (date) {
  var hours = date.getHours().toString()
  while (hours.length < 2) hours = `0${hours}`

  var minutes = date.getMinutes().toString()
  while (minutes.length < 2) minutes = `0${minutes}`

  return `${hours}:${minutes}`
}

function removeTime (t, times) {
  var ev = times.find(time => time.date === t)

  if (ev) times.delete(ev)
}

function Event (date) {
  return {
    date,
    data: {attending: true}
  }
}
