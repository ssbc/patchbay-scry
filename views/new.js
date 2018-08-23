const { h, Struct, Array: MutantArray, when, computed } = require('mutant')
const Marama = require('marama')

module.exports = function ScryNew (opts) {
  const state = Struct({
    monthIndex: new Date().getMonth(),
    days: MutantArray([]),
    pristine: true
  })

  const page = h('ScryNew', [
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
        h('div.picker'),
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

  return page

  function setMonth (d) {
    state.monthIndex.set(state.monthIndex() + d)
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
      state.days.push({
        date: gte,
        data: {attending: true}
      })
    }
    function clearDay () {
      const filteredEvents = state.days().filter(e => !days.includes(e))
      state.days.set(filteredEvents)
    }
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
