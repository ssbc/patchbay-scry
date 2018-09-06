const { h, resolve, computed } = require('mutant')

module.exports = function ShowAuthorActions ({ poll, myFeedId, state, scuttle, name }) {
  if (poll.value.author !== myFeedId) return

  return h('ScryShowAuthorActions', [
    ResolveBtn(),
    PublishResolveBtn()
  ])

  function ResolveBtn () {
    const toggleResolving = () => {
      const newState = !resolve(state.mode.isResolving)
      state.mode.isResolving.set(newState)
    }

    return h('button.resolve', { 'ev-click': toggleResolving }, [
      h('i.fa.fa-star-half-o'),
      'Resolve'
    ])
  }

  function PublishResolveBtn () {
    return computed(state.mode, ({ isResolving, isPublishing }) => {
      if (!isResolving) return
      if (isPublishing) return h('button', h('i.fa.fa-spinner.fa-pulse'))

      const publish = () => {
        state.mode.isPublishing.set(true)
        const choices = resolve(state.next.resolution)
          .reduce((acc, choice, i) => {
            if (choice) acc.push(i)
            return acc
          }, [])

        const mentions = resolve(state.current.rows)
          .filter(r => r.position[0] !== null)
          .map(r => {
            return { link: r.author, name: resolve(name(r.author)) || '' }
          })

        scuttle.poll.async.publishResolution(
          { poll, choices, mentions },
          (err, data) => {
            debugger
            console.log('resolution:', err, data)
          }
        )
      }
      return h('button.publish-resolution', { 'ev-click': publish }, [
        'Publish',
        h('i.fa.fa-paper-plane-o')
      ])
    })
  }
}
