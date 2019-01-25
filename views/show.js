const { h, Struct, computed, resolve } = require('mutant')
const pull = require('pull-stream')
const { isGathering } = require('ssb-gathering-schema')
const getContent = require('ssb-msg-content')

const ShowGathering = require('./component/show-gathering')
const ShowClosesAt = require('./component/show-closes-at')
const ShowAuthorActions = require('./component/show-author-actions')
const ShowResults = require('./component/show-results')
const Timezone = require('./component/timezone')

// TODO
// - [x] add mentions to the poll-resolution!
//   - (later) add a message renderer for poll-resolution type messages
// - [ ] review the logic, try for refactor
//   - this is turning into a state-machine D;

module.exports = function ScryShow (opts) {
  const {
    poll,
    myFeedId,
    scuttle,
    name = k => k.slice(0, 9),
    avatar = k => h('img'),
    mdRenderer = (text) => text,
    NewGathering,
    testing = false
  } = opts

  const state = LiveState({ scuttle, poll, myFeedId })
  const symbols = getSymbols(testing)

  return h('ScryShow', [
    h('h1', state.current.title),
    ShowClosesAt(state.current),
    h('div.description', computed((state.current.description), mdRenderer)),
    ShowGathering(state.current.gathering),
    ShowAuthorActions({ poll, myFeedId, state, scuttle, name, NewGathering }),
    h('div.timezone', [
      h('label', 'All times are in your current timezone: '),
      Timezone()
    ]),
    ShowResults({ state, myFeedId, name, avatar, symbols }),
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
}

function validResolution (arr) {
  // valid as in not a dummy resolution that's a placeholder
  return arr.every(el => el !== null)
}

// component

// lib/ helper?

function LiveState ({ scuttle, poll, myFeedId }) {
  const state = {
    current: Struct({
      keu: '',
      title: '',
      description: '',
      times: [],
      closesAt: undefined,
      rows: [],
      position: [],
      resolution: [],
      gathering: undefined,
      backlinks: []
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

  // TODO check if isEditing before re-fetching state
  // TODO factor out updateStream (see about.pull.updates pattern)
  pull(
    scuttle.poll.pull.updates(poll.key || poll),
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

    const { title, body, closesAt, positions, backlinks } = doc
    const times = doc.results.map(result => result.choice)
    const results = times.map(t => doc.results.find(result => result.choice === t))
    // this ensures results Array is in same order as a times Array

    const rows = buildRows({ positions, results, times })
    // Array with entries  { author: feedId, position: [true, true, false, true, ...] }
    const myRow = rows.find(r => r.author === myFeedId)
    const myPosition = myRow ? myRow.position : Array(times.length).fill(null)

    const resolution = buildResolution({ resolution: doc.resolution, times })
    var nextResolution = resolution.map(el => el || false)
    // [ false, true, false, false, ... ] where true is a selected time column

    var isEditing = false
    if (!myRow && !validResolution(resolution) && closesAt > new Date()) {
      rows.push({ author: myFeedId, position: myPosition })
      isEditing = true
    }

    state.current.set({
      key: poll.key,
      title,
      description: body,
      closesAt,
      times,
      rows,
      position: myPosition,
      resolution,
      gathering: findGathering(backlinks, poll)
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

function buildRows ({ positions, times, results }) {
  return positions
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
}

function buildResolution ({ resolution: res, times }) {
  var resolution = Array(times.length).fill(null)

  if (res) {
    resolution = resolution.map((_, i) => res.choices.includes(i))
  }
  return resolution
}

function findGathering (backlinks, poll) {
  return backlinks
    .filter(isGathering)
    .find(m => getContent(m).progenitor === poll.key)
}

function getSymbols (testing) {
  return testing
    ? {
      tick: () => '✔',
      checkedBox: () => '☑',
      uncheckedBox: () => '☐',
      star: () => '★',
      starEmpty: () => '☐'
    }
    : {
      tick: () => '✔',
      checkedBox: () => h('i.fa.fa-check-square-o'),
      uncheckedBox: () => h('i.fa.fa-square-o'),
      star: () => h('i.fa.fa-star'),
      starEmpty: () => h('i.fa.fa-star-o')
    }
}
