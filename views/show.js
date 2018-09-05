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
    ScryShowClosesAt(state.now),
    ScryShowResults(),
    h('div.actions', [
      PublishBtn()
    ])
  ])

  function PublishBtn () {
    return computed([state.now, state.next], (current, next) => {
      if (current.resolution) return
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
    return computed(state.now, ({ title, closesAt, times, rows, resolution }) => {
      const style = {
        display: 'grid',
        'grid-template-columns': `minmax(10rem, auto) repeat(${times.length}, 4rem)`
      }

      const getChosenClass = i => {
        if (!resolution) return ''
        return resolution.choices.includes(i) ? '-chosen' : '-not-chosen'
      }

      return [
        h('ScryShowResults', { style }, [
          ScryShowTimes(times, getChosenClass),
          ScryShowResolution(times, resolution),
          ScryShowSummary(rows, getChosenClass),
          ScryShowPositions(rows)
        ])
      ]
    })
  }

  function ScryShowPositions (rows) {
    return rows.map(({ author, position }) => {
      if (author !== myFeedId) return OtherPosition(author, position)
      else return MyPosition(position)
    })

    function OtherPosition (author, position) {
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

    function MyPosition (position) {
      const toggleEditing = () => {
        const isEditing = !resolve(state.next.isEditing)
        state.next.isEditing.set(isEditing)
      }

      return [
        h('div.about', [
          avatar(myFeedId),
          name(myFeedId),
          h('i.fa.fa-pencil', { 'ev-click': toggleEditing })
        ]),
        computed([state.next, state.now.position], ({ isEditing, position }, currentPosition) => {
          if (!isEditing) {
            return currentPosition.map(pos => pos
              ? h('div.position.-yes', tick())
              : h('div.position.-no')
            )
          }

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
        })
      ]
    }
  }

  function ScryShowResolution (times, resolution) {
    if (!resolution) return

    return times.map((_, i) => {
      const style = { 'grid-column': i + 2 } // grid-columns start at 1 D:
      const isChoice = resolution.choices.includes(i)
      const className = isChoice ? '-chosen' : ''

      return h('div.resolution', { style, className },
        isChoice ? star() : ''
      )
    })
  }

  function ScryShowSummary (rows, getChosenClass) {
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
      if (!myRow && !doc.resolution) {
        rows.push({ author: myFeedId, position: myPosition })
        isEditing = true
      }

      state.now.set({
        title,
        closesAt,
        times,
        rows,
        resolution: doc.resolution,
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
  function star () { return testing ? '★' : h('i.fa.fa-star') }
}

function initialState () {
  return {
    now: Struct({
      title: '',
      times: [],
      closesAt: undefined,
      resolution: undefined,
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

function ScryShowClosesAt ({ closesAt, resolution }) {
  return h('div.closes-at', computed([closesAt, resolution], (t, resolution) => {
    if (resolution) return
    if (!t) return

    const distance = t - new Date()
    if (distance < 0) return 'This scry has closed, but a resolution has yet to be declared.'

    const hours = Math.floor(distance / (60 * 60e3))
    const days = Math.floor(hours / 24)
    return `This scry closes in ${days} days, ${hours % 24} hours`
  }))
}

// component: show-time

function ScryShowTimes (times, getChosenClass) {
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
