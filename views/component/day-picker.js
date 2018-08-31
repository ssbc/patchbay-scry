const { h, computed } = require('mutant')
const Marama = require('marama')

module.exports = function DayPicker (state) {
  const startOfToday = startOfDay()

  return h('ScryDayPicker', [
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
  ])

  function setMonth (d) {
    state.monthIndex.set(state.monthIndex() + d)
  }

  function onSelect ({ gte, lt, events: dayEvents }) {
    if (gte < startOfToday) return

    if (!dayEvents.length) addEmptyEvent()
    else clearDay()

    function addEmptyEvent () {
      state.days.push(Event(gte))
    }
    function clearDay () {
      const prunedEvents = state.days().filter(e => !dayEvents.includes(e))
      state.days.set(prunedEvents)
    }
  }
}

function MonthTitle (monthIndex) {
  const MONTHS = [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ]

  return computed(monthIndex, mi => {
    const now = new Date()
    const view = new Date(now.getFullYear(), mi, 1)

    return `${MONTHS[view.getMonth()]} ${view.getFullYear()}`

    // while (monthIndex < 0) { monthIndex += 12 }
    // return `${MONTHS[(monthIndex) % 12]} ${year}`
  })
}

function Event (date) {
  return {
    date,
    data: {attending: true}
  }
}

function startOfDay (d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}
