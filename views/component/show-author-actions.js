const { h, resolve, computed } = require('mutant')

module.exports = function ShowAuthorActions ({ poll, myFeedId, state, scuttle, name, NewGathering }) {
  if (poll.value.author !== myFeedId) return

  return computed([state.mode, state.current], ({ isResolving, isPublishing }, current) => {
    if (current.gathering) return

    const mentions = current.rows
      .filter(r => r.position[0] !== null)
      .map(r => {
        return { link: r.author, name: resolve(name(r.author)) || '' }
      })

    return h('ScryShowAuthorActions', [
      h('div.resolve', [
        ResolveBtn({ state, isResolving }),
        PublishResolveBtn({ poll, state, scuttle, mentions, isResolving, isPublishing })
      ]),
      PublishGatheringBtn({ NewGathering, poll, current, mentions })
    ])
  })
}

// components

function ResolveBtn ({ state, isResolving }) {
  const toggle = () => {
    state.mode.isResolving.set(!isResolving)
  }

  return h('button.resolve',
    { className: isResolving ? '-subtle' : '', 'ev-click': toggle },
    [ h('i.fa.fa-star-half-o'), 'Resolve' ]
  )
}

function PublishResolveBtn ({ poll, state, scuttle, mentions, isResolving, isPublishing }) {
  if (!isResolving) return
  if (isPublishing) return h('button', h('i.fa.fa-spinner.fa-pulse'))

  const publish = () => {
    state.mode.isPublishing.set(true)
    const choices = resolve(state.next.resolution)
      .reduce((acc, choice, i) => {
        if (choice) acc.push(i)
        return acc
      }, [])

    scuttle.poll.async.publishResolution(
      { poll, choices, mentions },
      (err, data) => {
        console.log('resolution:', err, data)
      }
    )
  }
  return h('button.publish-resolution',
    { 'ev-click': publish, className: isResolving ? '-primary' : '' },
    [ 'Publish', h('i.fa.fa-paper-plane-o') ]
  )
}

function PublishGatheringBtn ({ NewGathering, poll, current: state, mentions }) {
  if (!NewGathering) return
  if (!hasResolution(state)) return

  const { title, times, resolution, key: progenitor } = state

  const time = times.reduce((acc, time, i) => {
    if (acc) return acc
    if (resolution[i]) return time
  }, 0)
  const initialState = {
    title,
    startDateTime: { epoch: Number(time) },
    progenitor,
    mentions
  }

  return h('div.new-gathering', [
    h('button -primary',
      { 'ev-click': ev => NewGathering(initialState, ev.target.parentNode) }, // initialState, root
      [ 'Create Gathering', h('i.fa.fa-calendar') ]
    )
  ])
}

// helpers

function hasResolution (currentState) {
  return !currentState.resolution.every(t => t === null)
}
