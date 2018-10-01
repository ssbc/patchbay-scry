const { h } = require('mutant')
const printTime = require('../../lib/print-time')

module.exports = function ScryShowTimes ({ times, getChosenClass }) {
  return times.map((time, i) => {
    const style = { 'grid-column': i + 2 } // grid-columns start at 1 D:

    return h('ScryShowTime', { style, className: getChosenClass(i) }, [
      h('div.month', month(time)),
      h('div.date', time.getDate()),
      h('div.day', day(time)),
      h('div.time', printTime(time))
    ])
  })
}

function month (date) {
  const months = ['Jan', 'Feb', 'March', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']

  return months[date.getMonth()]
}

function day (date) {
  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat']

  return days[date.getDay()]
}
