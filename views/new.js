const { h, Struct, Array: MutantArray, computed, resolve } = require('mutant')
const Invoke = require('./new-steps/invoke')
const PickTimes = require('./new-steps/pick-times')
const AddMentions = require('./new-steps/add-mentions')

module.exports = function ScryNew (opts) {
  const {
    scuttle,
    afterPublish = () => console.log('published scry poll'),
    myKey,
    avatar,
    suggest
  } = opts

  const initialState = {
    step: 0,
    title: '',
    description: '',
    closesAt: getInitialClosesAt(),
    monthIndex: new Date().getMonth(),
    days: MutantArray([]),
    times: MutantArray([]),
    mentions: MutantArray([])
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
          next: () => state.step.set(step + 1)
        })
        case 2: return AddMentions({
          state,
          myKey,
          avatar,
          suggest,
          prev: () => state.step.set(step - 1),
          next: publish
        })
      }
    })
  ])

  function publish () {
    const { title, days, times, closesAt, description, mentions } = resolve(state)

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
      choices,
      closesAt: closesAt.toISOString(),
      body: description,
      mentions
    }

    scuttle.poll.async.publishMeetingTime(opts, (err, data) => {
      if (err) return console.error(err)

      state.set(initialState)
      afterPublish(data)
    })
  }
}

function getInitialClosesAt () {
  const d = new Date()

  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3, 12)
}
