const { h, Struct, computed, resolve } = require('mutant')
const pull = require('pull-stream')
const printTime = require('../lib/print-time')

const YES = '✔'
const EDIT_YES = '☑'
const EDIT_NO = '☐'

module.exports = function ScryShow (opts) {
  const {
    poll,
    myFeedId,
    scuttle,
    name = k => k.slice(0, 9)
    // avatar = ''
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
    ScryShowTable(),
    computed([state.now, state.next], (current, next) => {
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
              console.log(err, data)
            })
          }
        }, 'Publish'
      )
    })
  ])

  function ScryShowTable () {
    return computed(state.now, ({ title, closesAt, times, rows }) => {
      const style = {
        display: 'grid',
        'grid-template-columns': `minmax(8rem, auto) repeat(${times.length}, 4rem)`
      }

      return [
        h('div.results', { style }, [
          times.map(ScryShowTime),
          rows.map(ScryShowRow)
        ])
      ]
    })
  }

  function ScryShowRow ({ author, position }) {
    if (author !== myFeedId) {
      return [
        h('div.name', name(author)),
        position.map(pos => pos
          ? h('div.position.-yes', YES)
          : h('div.position.-no')
        )
      ]
    }

    return [
      h('div.name', name(author)),
      computed(state.next, ({ isEditing, position }) => {
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
              pos ? EDIT_YES : EDIT_NO
            )
          })
        }

        return position.map(pos => pos
          ? h('div.position.-yes', '✔')
          : h('div.position.-no')
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
      const myPosition = myRow ? myRow.position : Array(times.length).fill(false)

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
      pull.drain(cb)
    )
  }
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
