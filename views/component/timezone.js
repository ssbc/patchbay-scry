const { h } = require('mutant')

module.exports = function Timezone () {
  return h('ScryTimezone', [
    getTimezone(),
    h('span', ['(UTC ', getTimezoneOffset(), ')'])
  ])
}
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
