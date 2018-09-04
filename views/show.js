const { h, Struct, computed, resolve } = require('mutant')
const pull = require('pull-stream')
const printTime = require('../lib/print-time')

module.exports = function ScryShow (opts) {
  const {
    poll,
    myFeedId,
    scuttle,
    name = k => k.slice(0, 9),
    avatar = k => h('img'),
    testing = false
  } = opts

  const state = Struct(initialState())
  fetchState()
  watchForUpdates(fetchState)

  return h('ScryShow', [
    h('h1', state.now.title),
    h('div.closes-at', [
      'Closes at ',
      computed(state.now.closesAt, t => t ? t.toString() : '')
    ]),
    ScryShowResults(),
    h('div.actions', [
      PublishBtn()
    ])
  ])

  function PublishBtn () {
    return computed([state.now, state.next], (current, next) => {
      if (!next.isEditing) return
      if (next.isPublishing) return h('button', h('i.fa.fa-spin.fa-pulse'))

      const newPosition = current.position.join() !== next.position.join()
      return h('button',
        {
          className: newPosition ? '-primary' : '',
          disabled: !newPosition,
          'ev-click': () => {
            state.next.isPublishing.set(true)
            const choices = next.position.reduce((acc, el, i) => {
              if (el) acc.push(i)
              return acc
            }, [])

            scuttle.position.async.publishMeetingTime({ poll, choices }, (err, data) => {
              if (err) throw err
              console.log(data)
            })
          }
        }, 'Publish'
      )
    })
  }

  function ScryShowResults () {
    return computed(state.now, ({ title, closesAt, times, rows }) => {
      const style = {
        display: 'grid',
        'grid-template-columns': `minmax(10rem, auto) repeat(${times.length}, 4rem)`
      }

      return [
        h('ScryShowResults', { style }, [
          times.map(ScryShowTime),
          ScryShowSummary(rows),
          rows.map(ScryShowRow)
        ])
      ]
    })
  }

  function ScryShowRow ({ author, position }) {
    if (author !== myFeedId) {
      return [
        h('div.about', [
          avatar(author),
          name(author)
        ]),
        position.map(pos => pos
          ? h('div.position.-yes', tick())
          : h('div.position.-no')
        )
      ]
    }

    const toggleEditing = () => {
      const isEditing = !resolve(state.next.isEditing)
      state.next.isEditing.set(isEditing)
    }

    return [
      h('div.about', [
        avatar(author),
        name(author),
        h('i.fa.fa-pencil', { 'ev-click': toggleEditing })
      ]),
      computed([state.next, state.now.position], ({ isEditing, position }, currentPosition) => {
        if (isEditing) {
          return position.map((pos, i) => {
            return h('div.position.-edit',
              {
                'ev-click': () => {
                  const nextPosition = resolve(state.next.position)
                  nextPosition[i] = !pos
                  state.next.position.set(nextPosition)
                }
              },
              pos ? checkedBox() : uncheckedBox()
            )
          })
        }

        return currentPosition.map(pos => pos
          ? h('div.position.-yes', tick())
          : h('div.position.-no')
        )
      })
    ]
  }

  function ScryShowSummary (rows) {
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
      counts.map(n => h('div.count', `${n}${tick()}`))
    ]
  }

  function fetchState () {
    scuttle.poll.async.get(poll.key, (err, doc) => {
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

      const myRow = rows.find(r => r.author === myFeedId)
      const myPosition = myRow ? myRow.position : Array(times.length).fill(null)

      var isEditing = false
      if (!myRow) {
        rows.push({ author: myFeedId, position: myPosition })
        isEditing = true
      }

      state.now.set({
        title,
        closesAt,
        times,
        rows,
        position: myPosition
      })
      state.next.set({
        position: Array.from(myPosition),
        isEditing,
        isPublishing: false
      })
    })
  }

  function watchForUpdates (cb) {
    // TODO check if isEditing before calling cb
    // start a loop to trigger cb after finished editing
    pull(
      scuttle.poll.pull.updates(poll.key),
      pull.filter(m => !m.sync),
      pull.drain(m => {
        cb()
      })
    )
  }

  function tick () { return '✔' }
  function checkedBox () { return testing ? '☑' : h('i.fa.fa-check-square-o') }
  function uncheckedBox () { return testing ? '☐' : h('i.fa.fa-square-o') }
}

function initialState () {
  return {
    now: Struct({
      title: '',
      times: [],
      closesAt: undefined,
      rows: [],
      position: []
    }),
    next: Struct({
      position: [],
      isEditing: false,
      isPublishing: false
    })
  }
}

// component: show-time

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
