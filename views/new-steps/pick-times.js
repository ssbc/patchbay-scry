const { h, when, computed } = require('mutant')
const DayPicker = require('../component/day-picker.js')
const TimePicker = require('../component/time-picker.js')

module.exports = function PickTimes (state) {
  return h('ScryNewPickTimes', [
    DayPicker(state),
    when(computed(state.days, d => Boolean(d.length)),
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
      ]),
      h('div.time-picker-pristine', [
        h('label', 'Dates and Times'),
        h('div.instruction', 'Select one or multiple dates')
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
