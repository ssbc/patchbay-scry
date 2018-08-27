const { h, Value, Struct, Array: MutantArray, when, computed } = require('mutant')
const DayPicker = require('./component/day-picker.js')
const TimePicker = require('./component/time-picker.js')

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
    DayPicker(state),
    when(state.pristine,
      h('div.time-picker-pristine', [
        h('label', 'Dates and Times'),
        h('div.instruction', 'Select one or multiple dates')
      ]),
      h('div.time-picker', [
        h('label', computed(state.days, days => `Same times for all dates (${days.length})`)),
        TimePicker(state),
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
}

// functions

function getTimezone () {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch (e) {
    return '??'
  }
}

function getTimezoneOffset () {
  const offset = new Date().getTimezoneOffset() / -60
  return offset > 0 ? `+${offset}` : offset
}
