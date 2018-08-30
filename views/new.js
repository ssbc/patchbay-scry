const { h, Struct, Array: MutantArray, computed, resolve } = require('mutant')
const Invoke = require('./new-steps/invoke')
const PickTimes = require('./new-steps/pick-times')

module.exports = function ScryNew (opts) {
  const {
    scuttle,
    afterPublish = () => console.log('published scry poll')
  } = opts

  const initialState = {
    step: 0,
    title: '',
    closesAt: getInitialClosesAt(),
    monthIndex: new Date().getMonth(),
    days: MutantArray([]),
    times: MutantArray([])
  }
  const state = Struct(initialState)

  return h('ScryNew', [
    computed(state.step, step => {
      switch (step) {
        case 0: return Invoke({
          state,
          next: () => state.step.set(step + 1)
        })
        case 1: return PickTimes({
          state,
          prev: () => state.step.set(step - 1),
          next: publish
        })
      }
    })
  ])

  function publish () {
    const { title, days, times } = resolve(state)

    const _days = days
      .map(ev => ev.date)
      .sort((a, b) => a - b)
      .map(d => [d.getFullYear(), d.getMonth(), d.getDate()])
    const _times = times
      .map(ev => ev.date)
      .sort((a, b) => a - b)
      .map(t => [t.getHours(), t.getMinutes()])
    const choices = _days.reduce((acc, d) => {
      _times.forEach(t => {
        acc.push(new Date(...d, ...t).toISOString())
      })

      return acc
    }, [])

    const opts = {
      title,
      choices
    }

    scuttle.poll.sync.publishMeetingTime(opts, (err, data) => {
      if (err) return console.debug(err)

      state.set(initialState)
      afterPublish(data)
    })
  }
}

function getInitialClosesAt () {
  const d = new Date()

  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3, 12)
}
