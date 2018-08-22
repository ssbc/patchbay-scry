const { h, Struct, Array: MutantArray, computed } = require('mutant')
const Marama = require('marama')

module.exports = function ScryNew (opts) {
  const state = Struct({
    month: new Date().getMonth() + 1,
    events: MutantArray([])
  })

  const page = h('div.page', [
    h('div.picker', [
      h('div.month-picker', [
        h('button', { 'ev-click': () => setMonth(-1) }, '<'),
        monthName(state.month),
        h('button', { 'ev-click': () => setMonth(+1) }, '>')
      ]),
      computed(state, ({ month, events }) => {
        return Marama({
          month,
          events,
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
    h('div.dates', [
      computed(state.events, events => {
        return events
          .sort((a, b) => a.date - b.date)
          .map(e => h('div.date', e.date.toDateString()))
      })
    ])
  ])

  return page


  function setMonth (d) {
    state.month.set(state.month() + d)
  }

  function monthName (month) {
    const MONTHS = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ]

    return computed(state.month, m => {
      var monthIndex = m - 1
      while (monthIndex < 0) { monthIndex += 12 }
      return MONTHS[(monthIndex) % 12]
    })
  }

  function onSelect ({ gte, lt, events }) {
    if (!events.length) addEmptyEvent()
    else clearDay()

    function addEmptyEvent () {
      state.events.push({
        date: gte,
        data: {attending: true}
      })
    }
    function clearDay () {
      const filteredEvents = state.events().filter(e => !events.includes(e))
      state.events.set(filteredEvents)
    }
  }

}

