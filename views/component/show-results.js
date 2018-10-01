const { h, computed, resolve } = require('mutant')

const ShowTimes = require('./show-times')
const ShowTotals = require('./show-totals')

module.exports = function ShowResults ({ state, myFeedId, name, avatar, symbols }) {
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
        ShowTimes({ times, getChosenClass }),
        ShowResolution({ state, times, resolution, symbols }),
        ShowTotals({ rows, symbols, getChosenClass }),
        ShowPositions({ state, rows, myFeedId, symbols, name, avatar })
      ])
    ]
  })
}

function ShowResolution ({ state, times, resolution, symbols }) {
  return computed([state.mode.isResolving, state.next.resolution], (isResolving, nextResolution) => {
    if (!isResolving && validResolution(resolution)) {
      return times.map((_, i) => {
        const style = { 'grid-column': i + 2 } // grid-columns start at 1 D:
        const isChoice = Boolean(resolution[i])
        const className = isChoice ? '-chosen' : ''

        return h('div.resolution', { style, className },
          isChoice ? symbols.star() : ''
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
            isChoice ? symbols.star() : symbols.starEmpty()
          )
        })
      ]
    }
  })
}

function ShowPositions ({ state, rows, myFeedId, symbols, name, avatar }) {
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
        ? h('div.position.-yes', symbols.tick())
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
            ? h('div.position.-yes', symbols.tick())
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
            pos ? symbols.checkedBox() : symbols.uncheckedBox()
          )
        })
      })
    ]
  }
}

// helper - NOTE this is repeated in show.js
function validResolution (arr) {
  // valid as in not a dummy resolution that's a placeholder
  return arr.every(el => el !== null)
}
