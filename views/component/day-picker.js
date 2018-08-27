const { h, computed } = require('mutant')
const Marama = require('marama')

module.exports = function DayPicker (state) {
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

function Event (date) {
  return {
    date,
    data: {attending: true}
  }
}
