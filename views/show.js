const { h, Struct, Array: MutantArray, map, computed, resolve } = require('mutant')
const printTime = require('../lib/print-time')

module.exports = function ScryShow (opts) {
  const {
    key,
    scuttle,
    name = k => k.slice(0, 9)
    // avatar = ''
  } = opts

  const state = Struct(initialState())
  fetchState()

  const body = computed(state, state => {
    const { title, closesAt, times, rows } = state

    const style = {
      display: 'grid',
      'grid-template-columns': `minmax(8rem, auto) repeat(${times.length}, 4rem)`
    }

    return [
      h('h1', title),
      h('div.closes-at', [
        'Closes at ',
        closesAt ? closesAt.toString() : ''
      ]),
      h('div.results', { style }, [
        times.map(ScryShowTime),
        rows.map(({ author, position }, i) => {
          return [
            h('div.name', name(author)),
            position.map(pos => pos
              ? h('div.position.-yes', '✔')
              : h('div.position.-no')
            )
          ]
          // const style = { 'grid-column': i + 2 }
        })

      ])
    ]
  })

  return h('ScryShow', body)

  function initialState () {
    return {
      title: '',
      times: [],
      closesAt: undefined,
      rows: []
    }
  }

  function fetchState () {
    scuttle.poll.async.get(key, (err, doc) => {
      if (err) return console.error(err)

      const { title, closesAt, positions } = doc
      const times = doc.results.map(result => result.choice)
      const results = times.map(t => doc.results.find(result => result.choice === t))
      // this ensures results Array is in same order as a times Array

      const rows = positions
        .reduce((acc, pos) => {
          if (!acc.includes(pos.value.author)) acc.push(pos.value.author)
          return acc
        }, [])
        .map(author => {
          const position = times.map((time, i) => {
            return results[i].voters.hasOwnProperty(author)
          })
          return { author, position }
        })

      state.set({
        title,
        closesAt,
        times,
        rows
      })
    })
  }
}

function ScryShowTime (time, i) {
  const style = { 'grid-column': i + 2 }

  return h('ScryShowTime', { style }, [
    h('div.month', month(time)),
    h('div.date', time.getDate()),
    h('div.day', day(time)),
    h('div.time', printTime(time))
  ])
}

function month (date) {
  const months = ['Jan', 'Feb', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return months[date.getMonth()]
}

function day (date) {
  const days = ['Sun', 'Mon', 'Tues', 'Wed', 'Thu', 'Fri', 'Sat']

  return days[date.getDay()]
}
