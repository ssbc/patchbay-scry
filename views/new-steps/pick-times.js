const { h, computed } = require('mutant')
const DayPicker = require('../component/day-picker.js')
const TimePicker = require('../component/time-picker.js')

module.exports = function PickTimes ({ state, prev, nex }) {
  const nextBtn = computed(state, ({ days, times }) => {
    var opts = (!days.length || !times.length)
      ? { disabled: 'disabled' }
      : { className: '-primary', 'ev-click': next }

    return h('button', opts, 'Next')
  })

  return h('ScryNewPickTimes', [
    DayPicker(state),
    computed(state.days, days => {
      if (!days.length) {
        return h('div.time-picker-pristine', [
          h('label', 'Dates and Times'),
          h('div.instruction', 'Select one or multiple dates')
        ])
      }

      return h('div.time-picker', [
        h('label', `Same times for all dates (${days.length})`),
        TimePicker(state),
        h('div.timezone', [
          h('label', 'Timezone of your scry is'),
          h('div.zone', [
            getTimezone(),
            h('span', ['(UTC ', getTimezoneOffset(), ')'])
          ])
        ])
      ])
    }),
    h('div.actions', [
      prev ? h('button', { 'ev-click': prev }, 'Back') : null,
      next ? nextBtn : null
    ])
  ])
}

// helpers

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
