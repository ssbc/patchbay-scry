const { h, Value, Struct, Array: MutantArray, when, computed } = require('mutant')
const Marama = require('marama')

module.exports = function ScryNew (opts) {
  const {
    // i18n
  } = opts

  const state = Struct({
    pristine: true,
    monthIndex: new Date().getMonth(),
    days: MutantArray([]),
    times: MutantArray([])
  })

  return h('ScryNew', [
    h('div.cal-picker', [
      h('div.month-picker', [
        h('button', { 'ev-click': () => setMonth(-1) }, '<'),
        MonthTitle(state.monthIndex),
        h('button', { 'ev-click': () => setMonth(+1) }, '>')
      ]),
      computed(state, ({ monthIndex, days }) => {
        return Marama({
          monthIndex,
          events: days,
          onSelect,
          styles: {
            weekFormat: 'rows',
            showNumbers: true,
            tileRadius: 16,
            tileGap: 8
          }
        })
      })
    ]),
    when(state.pristine,
      h('div.time-picker-pristine', [
        h('label', 'Dates and Times'),
        h('div.instruction', 'Select one or multiple dates')
      ]),
      h('div.time-picker', [
        h('label', computed(state.days, days => `Same times for all dates (${days.length})`)),
        h('div.picker', [
          computed(state.times, times => {
            return times
              .map(time => time.date)
              // .sort((a, b) => a - b)
              .map(TimeEntry)
          }),
          NewTimeEntry()
        ]),
        h('div.timezone', [
          h('label', 'Timezone of your scry is'),
          h('div.zone', [
            getTimezone(),
            h('span', ['(UTC ', getTimezoneOffset(), ')'])
          ])
        ])
      ])
    )
  ])

  // functions

  function setMonth (d) {
    state.monthIndex.set(state.monthIndex() + d)
  }

  function NewTimeEntry () {
    var active = Value(false)

    // TODO extract and only run once
    const options = Array(96).fill(0).map((_, i) => {
      var time = new Date ()
      time.setHours(0)
      time.setMinutes(15 * i)
      return time

    })

    return h('div.new-time-entry', [
      when(active,
        h('div.dropdown', options.map(time => {
          return h('div',
            {
              'ev-click': () => { 
                state.times.push(Event(time))
                active.set(false)
              }
            },
            printTime(time)
          )
        }))
      ),
      h('div.add', { 'ev-click': () => active.set(true) }, '+ Add more times')
    ])
  }

  function TimeEntry (date) {
    return h('div.time-entry', [
      h('div.time', printTime(date)),
      h('div.close', { 'ev-click': () => removeTime(date) }, '×')
      // h('i.fa.fa-close')
    ])
  }

  function removeTime (d) {
    var ev = state.times.find(time => time.date === d)

    if (ev) state.times.delete(ev)
  }

  function MonthTitle (monthIndex) {
    const MONTHS = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]

    return computed(monthIndex, mi => {
      const view = new Date()
      view.setMonth(mi)

      return `${MONTHS[view.getMonth()]} ${view.getFullYear()}`

      // while (monthIndex < 0) { monthIndex += 12 }
      // return `${MONTHS[(monthIndex) % 12]} ${year}`
    })
  }

  function onSelect ({ gte, lt, events: days }) {
    if (!days.length) addEmptyEvent()
    else clearDay()

    state.pristine.set(false)

    function addEmptyEvent () {
      state.days.push(Event(gte))
    }
    function clearDay () {
      const filteredEvents = state.days().filter(e => !days.includes(e))
      state.days.set(filteredEvents)
    }
  }
}

function Event (date) {
  return {
    date,
    data: {attending: true}
  }
}

function getTimezone () {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (e) {
    return '??'
  }
}

function getTimezoneOffset () {
  return new Date().getTimezoneOffset() / 60
}

function printTime (date) {
  var hours = date.getHours().toString()
  while (hours.length < 2) hours = `0${hours}`

  var minutes = date.getMinutes().toString()
  while (minutes.length < 2) minutes = `0${minutes}`

  return `${hours}:${minutes}`
}
