const { h, computed } = require('mutant')

module.exports = function ShowClosesAt ({ closesAt, resolution, gathering }) {
  return computed([closesAt, resolution, gathering], (t, resolution, gathering) => {
    if (gathering) return
    if (validResolution(resolution)) return
    if (!t) return

    const distance = t - new Date()
    if (distance < 0) return 'This scry has closed, but a resolution has yet to be declared.'

    const hours = Math.floor(distance / (60 * 60e3))
    const days = Math.floor(hours / 24)

    return h('div.closes-at', [
      (days === 0)
        ? `This scry closes in ${hours % 24} hours`
        : `This scry closes in ${days} days, ${hours % 24} hours`
    ])
  })
}

// copied from show.js

function validResolution (arr) {
  // valid as in not a dummy resolution that's a placeholder
  return arr.every(el => el !== null)
}
