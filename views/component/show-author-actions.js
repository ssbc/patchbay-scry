const { h, resolve, computed, when } = require('mutant')
const { isGathering } = require('ssb-gathering-schema')
const getContent = require('ssb-msg-content')

module.exports = function ShowAuthorActions ({ poll, myFeedId, state, scuttle, name, NewGathering }) {
  if (poll.value.author !== myFeedId) return

  return h('ScryShowAuthorActions', [
    h('div.resolve', [
      ResolveBtn(),
      PublishResolveBtn()
    ]),
    PublishGatheringBtn()
  ])

  function ResolveBtn () {
    const toggleResolving = () => {
      const newState = !resolve(state.mode.isResolving)
      state.mode.isResolving.set(newState)
    }

    return h('button.resolve',
      {
        className: when(state.mode.isResolving, '-subtle'),
        'ev-click': toggleResolving
      },
      [
        h('i.fa.fa-star-half-o'),
        'Resolve'
      ]
    )
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
            console.log('resolution:', err, data)
          }
        )
      }
      return h('button.publish-resolution',
        {
          'ev-click': publish,
          className: isResolving ? '-primary' : ''
        },
        [
          'Publish',
          h('i.fa.fa-paper-plane-o')
        ]
      )
    })
  }

  function PublishGatheringBtn () {
    return computed(state.current, (current) => {
      const { key, times, resolution, backlinks, title } = current
      if (resolution.every(t => t === null)) return

      const offspring = backlinks
        .filter(isGathering)
        .find(m => getContent(m).progenitor === poll.key)



      if (offspring) {
        return h('div.new-gathering', [
          'Gathering: ',
          h('a', { href: offspring.key }, offspring.key.slice(0, 9)) // TODO fix, not very general!
        ])
      }

      if (!NewGathering) return

      const time = times.reduce((acc, time, i) => {
        if (acc) return acc
        if (resolution[i]) return time
      }, 0)
      const initialState = {
        title,
        startDateTime: { epoch: Number(time) },
        progenitor: key
      }
      return h('div.new-gathering', [
        h('button -primary',
          {
            'ev-click': ev => {
              NewGathering(initialState, ev.target.parentNode) // initialState, root
            }
          },
          'Create Gathering'
        )
      ])
    })
  }
}
