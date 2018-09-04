// run:
// $ npx electro views/show.test.js

const h = require('mutant/h')
const sbot = require('scuttle-testbot')
  .use(require('ssb-backlinks'))
  .call()

const pull = require('pull-stream')
const scuttle = require('scuttle-poll')(sbot)
const isPosition = require('scuttle-poll/isPosition')

const Show = require('./show')

// scry
const opts = {
  title: 'Ziva\'s first Birthday Party',
  choices: [
    time(2018, 10, 21, 10),
    time(2018, 10, 21, 14),
    time(2018, 10, 21, 16),
    time(2018, 10, 22, 10),
    time(2018, 10, 22, 14),
    time(2018, 10, 22, 16)
  ],
  closesAt: time(2018, 10, 1)
}

const katie = sbot.createFeed()
const piet = sbot.createFeed()

const positions = [
  // { author: sbot, choices: [0, 1, 2, 3, 4, 5] },
  { author: katie, choices: [0, 1, 2, 3] },
  { author: katie, choices: [0, 3] },
  { author: piet, choices: [3, 5] }
]

scuttle.poll.async.publishMeetingTime(opts, (err, poll) => {
  if (err) return console.error(err)

  pull(
    pull.values(positions),
    pull.asyncMap(({ author, choices }, cb) => {
      const opts = {
        type: 'position',
        version: 'v1',
        details: {
          type: 'meetingTime',
          choices
        },
        root: poll.key,
        branch: poll.key
      }

      if (isPosition.meetingTime(opts)) author.publish(opts, cb)
      else cb(new Error('not a valid meetingTime position', opts))
    }),
    pull.drain(
      msg => console.log('yep'),
      (err) => {
        if (err) console.error(err)
        else render(poll)

        // // confirm positions were published
        // pull(
        //   sbot.backlinks.read({
        //     query: [{
        //       $filter: { dest: poll.key }
        //     }, {
        //       $map: {
        //         author: ['value', 'author'],
        //         details: ['value', 'content', 'details']
        //       }
        //     }]
        //   }),
        //   pull.drain(m => console.log(JSON.stringify(m, null, 2)))
        // )
      }
    )
  )
})

function render (poll) {
  const show = Show({
    poll,
    myFeedId: sbot.id,
    scuttle,
    name,
    testing: true
  })

  document.body.appendChild(show)

  // styles:

  require('../lib/styles-inject')()
  document.head.appendChild(
    h('style', `
      body {
        --gradient: linear-gradient(45deg, hsla(60, 100%, 56%, .5), hsla(280, 100%, 46%, 0.3));
        --texture: left top 0 / 3px radial-gradient(white, #de82e6) repeat ;
        background: var(--texture), var(--gradient);
        background-blend-mode: darken;

        height: 100vh;
        padding: 2rem;
      }
    `)
  )
}

// helpers

function name (feedId) {
  const names = {
    [sbot.id]: 'mix',
    [piet.id]: 'piet',
    [katie.id]: 'katie'
  }

  return names[feedId]
}

function time () {
  return new Date(...arguments).toISOString()
}
