const { h, Struct, computed, resolve } = require('mutant')
const pull = require('pull-stream')

const ShowTimes = require('./component/show-times')
const ShowTotals = require('./component/show-totals')
const ShowAuthorActions = require('./component/show-author-actions')

// TODO
// - [x] add mentions to the poll-resolution!
//   - (later) add a message renderer for poll-resolution type messages
//
//  - [ ] review the logic, try for refactor
//    - this is turning into a state-machine D;

module.exports = function ScryShow (opts) {
  const {
    poll,
    myFeedId,
    scuttle,
    name = k => k.slice(0, 9),
    avatar = k => h('img'),
    testing = false
  } = opts

  const state = LiveState({ scuttle, poll, myFeedId })

  return h('ScryShow', [
    h('h1', state.current.title),
    ShowClosesAt(state.current),
    ShowAuthorActions({ poll, myFeedId, state, scuttle, name }),
    ShowResults(),
    h('div.actions', [
      PublishBtn()
    ])
  ])


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

  function ShowResults () {
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
          ShowTimes(times, getChosenClass),
          ShowResolution(times, resolution),
          ShowTotals(rows, tick, getChosenClass),
          ShowPositions(rows)
        ])
      ]
    })
  }

  function ShowPositions (rows) {
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

  function ShowResolution (times, resolution) {
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

  function tick () { return '✔' }
  function checkedBox () { return testing ? '☑' : h('i.fa.fa-check-square-o') }
  function uncheckedBox () { return testing ? '☐' : h('i.fa.fa-square-o') }
  function star () { return testing ? '★' : h('i.fa.fa-star') }
  function starEmpty () { return testing ? '☐' : h('i.fa.fa-star-o') }
}

function validResolution (arr) {
  // valid as in not a dummy resolution that's a placeholder
  return arr.every(el => el !== null)
}

// component

function ShowClosesAt ({ closesAt, resolution }) {
  return h('div.closes-at', computed([closesAt, resolution], (t, resolution) => {
    if (!t) return
    if (validResolution(resolution)) return

    const distance = t - new Date()
    if (distance < 0) return 'This scry has closed, but a resolution has yet to be declared.'

    const hours = Math.floor(distance / (60 * 60e3))
    const days = Math.floor(hours / 24)
    if (days === 0) return `This scry closes in ${hours % 24} hours`
    return `This scry closes in ${days} days, ${hours % 24} hours`
  }))
}

// lib/ helper?

function LiveState ({ scuttle, poll, myFeedId }) {
  const state = {
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

  fetchState({ scuttle, poll, myFeedId, state })

  // TODO check if isEditing before calling cb
  // start a loop to trigger cb after finished editing
  pull(
    scuttle.poll.pull.updates(poll.key),
    pull.filter(m => !m.sync),
    pull.drain(m => {
      fetchState({ scuttle, poll, myFeedId, state })
    })
  )

  return state
}

function fetchState ({ scuttle, poll, myFeedId, state }) {
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
      // { author: feedId, position: [true, true, false, true, ...] }

    const myRow = rows.find(r => r.author === myFeedId)
    const myPosition = myRow ? myRow.position : Array(times.length).fill(null)

    var resolution = Array(times.length).fill(null)
    if (doc.resolution) {
      resolution = resolution.map((_, i) => doc.resolution.choices.includes(i))
    }
    var nextResolution = resolution.map(el => el || false)
    // [ false, true, false, false, ... ] where true is a selected time column

    var isEditing = false
    if (!myRow && !validResolution(resolution) && closesAt > new Date()) {
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
