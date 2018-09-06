const { h } = require('mutant')

// Note this doesn't feel like a standalone component so much
// but it is a bit of junk code it was easy to isolate

module.exports = function ShowTotals (rows, tick, getChosenClass) {
  if (!rows.length) return

  const participants = rows.filter(r => r.position[0] !== null).length

  const counts = rows[0].position.map((_, i) => {
    return rows.reduce((acc, row) => {
      if (row.position[i] === true) acc += 1
      return acc
    }, 0)
  })
  return [
    h('div.participants', participants === 1
      ? `${participants} participant`
      : `${participants} participants`
    ),
    counts.map((n, i) => {
      return h('div.count', { className: getChosenClass(i) },
        `${n}${tick()}`
      )
    })
  ]
}
