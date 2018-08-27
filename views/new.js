const { h, Struct, Array: MutantArray, computed } = require('mutant')
const PickTimes = require('./new-steps/pick-times')

module.exports = function ScryNew (opts) {
  // const {
  //   i18n
  // } = opts

  const state = Struct({
    step: 0,
    monthIndex: new Date().getMonth(),
    days: MutantArray([]),
    times: MutantArray([])
  })

  return h('ScryNew', [
    computed(state.step, step => {
      switch (step) {
        case 0: return PickTimes(state)
      }
    })
  ])
}
