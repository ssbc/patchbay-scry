const { h, computed } = require('mutant')

module.exports = function ShowGathering (gathering) {
  return computed(gathering, gathering => {
    if (!gathering) return

    return h('ScryShowGathering', [
      h('a.gathering', // TODO not very general!
        { href: gathering.key },
        [ h('i.fa.fa-calendar'), 'Gathering: ', gathering.key.slice(0, 9), '...' ]
      )
    ])
  })
}
