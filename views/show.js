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
    h('h1', state.current.title),
    ScryShowClosesAt(state.current),
    AuthorActions(),
    ScryShowResults(),
    h('div.actions', [
      PublishBtn()
    ])
  ])

  function AuthorActions () {
    if (poll.value.author !== myFeedId) return

    // TODO hide if already resolved ?

    return h('div.author-actions', [
      ResolveBtn(),
      PublishResolveBtn()
    ])

    function ResolveBtn () {
      const toggleResolving = () => {
        const newState = !resolve(state.mode.isResolving)
        state.mode.isResolving.set(newState)
      }

      return h('button', { 'ev-click': toggleResolving }, 'Resolve')
    }

    function PublishResolveBtn () {
      const publish = () => {
        const choices = resolve(state.next.resolution)
          .reduce((acc, choice, i) => {
            if (choice) acc.push(i)
            return acc
          }, [])
        // const mentions = []
        scuttle.poll.async.publishResolution({
          poll: poll,
          choices
        }, (err, data) => console.log('resolution:', err, data))
      }
      return h('button', { 'ev-click': publish }, 'Publish Resolution')
    }
  }

  function PublishBtn () {
    const publish = () => {
      state.mode.isPublishing.set(true)
      const choices = resolve(state.next.position).reduce((acc, el, i) => {
        if (el) acc.push(i)
        return acc
      }, [])

      scuttle.position.async.publishMeetingTime({ poll, choices }, (err, data) => {
        if (err) throw err
        console.log(data)
      })
    }

    return computed([state.current, state.next, state.mode], (current, next, mode) => {
      if (validResolution(current.resolution)) return
      if (!mode.isEditing) return
      if (mode.isPublishing) return h('button', h('i.fa.fa-spin.fa-pulse'))
      if (mode.isResolving) return

      const isNewPosition = current.position.join() !== next.position.join()
      return h('button',
        {
          className: isNewPosition ? '-primary' : '',
          disabled: !isNewPosition,
          'ev-click': publish
        }, 'Publish'
      )
    })
  }

  function ScryShowResults () {
    return computed([state.current, state.next.resolution, state.mode], (current, nextResolution, { isResolving }) => {
      const { times, rows, resolution } = current
      const style = {
        display: 'grid',
        'grid-template-columns': `minmax(10rem, auto) repeat(${times.length}, 4rem)`
      }

      const getChosenClass = i => {
        const relevant = isResolving ? nextResolution : resolution
        if (!validResolution(relevant)) return ''
        return relevant[i] ? '-chosen' : '-not-chosen'
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
        const newState = !resolve(state.mode.isEditing)
        state.mode.isEditing.set(newState)
      }

      // TODO disable pencil with resolution exists
      return [
        h('div.about', [
          avatar(myFeedId),
          name(myFeedId),
          h('i.fa.fa-pencil', { 'ev-click': toggleEditing })
        ]),
        computed([state.current.position, state.next.position, state.mode.isEditing], (position, nextPosition, isEditing) => {
          if (!isEditing) {
            return position.map(pos => pos
              ? h('div.position.-yes', tick())
              : h('div.position.-no')
            )
          }

          return nextPosition.map((pos, i) => {
            return h('div.position.-edit',
              {
                'ev-click': () => {
                  const newState = resolve(nextPosition)
                  newState[i] = !pos
                  state.next.position.set(newState)
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
    return computed([state.mode.isResolving, state.next.resolution], (isResolving, nextResolution) => {
      if (!isResolving && validResolution(resolution)) {
        return times.map((_, i) => {
          const style = { 'grid-column': i + 2 } // grid-columns start at 1 D:
          const isChoice = Boolean(resolution[i])
          const className = isChoice ? '-chosen' : ''

          return h('div.resolution', { style, className },
            isChoice ? star() : ''
          )
        })
      }

      if (isResolving) {
        const toggleChoice = (i) => {
          const newState = Array.from(nextResolution)
          newState[i] = !nextResolution[i]
          state.next.resolution.set(newState)
        }
        return [
          h('div.resolve-label', 'Final options'),
          times.map((_, i) => {
            const isChoice = Boolean(nextResolution[i])
            const classList = [ '-highlighted', isChoice ? '-chosen' : '' ]

            return h('div.resolution',
              { classList, 'ev-click': () => toggleChoice(i) },
              isChoice ? star() : starEmpty()
            )
          })
        ]
      }
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

      var resolution = Array(times.length).fill(null)
      if (doc.resolution) {
        resolution = resolution.map((_, i) => doc.resolution.choices.includes(i))
      }
      var nextResolution = resolution.map(el => el || false)

      var isEditing = false
      if (!myRow && !validResolution(resolution)) {
        rows.push({ author: myFeedId, position: myPosition })
        isEditing = true
      }

      state.current.set({
        title,
        closesAt,
        times,
        rows,
        position: myPosition,
        resolution
      })
      state.next.set({
        position: Array.from(myPosition),
        resolution: nextResolution
      })
      state.mode.set({
        isEditing,
        isPublishing: false,
        isResolving: false
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
  function starEmpty () { return testing ? '☐' : h('i.fa.fa-star-o') }
}

function initialState () {
  return {
    current: Struct({
      title: '',
      times: [],
      closesAt: undefined,
      rows: [],
      position: [],
      resolution: []
    }),
    next: Struct({
      position: [],
      resolution: []
    }),
    mode: Struct({
      isEditing: false,
      isPublishing: false,
      isResolving: false
    })
  }
}

function validResolution (arr) {
  // valid as in not a dummy resolution that's a placeholder
  return arr.every(el => el !== null)
}

// component

function ScryShowClosesAt ({ closesAt, resolution }) {
  return h('div.closes-at', computed([closesAt, resolution], (t, resolution) => {
    if (!t) return
    if (validResolution(resolution)) return

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
