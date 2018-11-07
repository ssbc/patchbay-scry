const nest = require('depnest')
const isPoll = require('scuttle-poll/isPoll')

exports.gives = nest('router.sync.routes')
exports.needs = nest({
  'app.page.scryIndex': 'first',
  'app.page.scryNew': 'first',
  'app.page.scryShow': 'first'
})

exports.create = (api) => {
  return nest('router.sync.routes', (sofar = []) => {
    const pages = api.app.page

    const routes = [
      [ loc => loc.page === 'scry', pages.scryIndex ],
      [ loc => loc.page === 'scry/new', pages.scryNew ],
      [ loc => loc.page === 'scry-new', pages.scryNew ],
      [ loc => isPoll.meetingTime(loc), pages.scryShow ]
    ]

    return [...sofar, ...routes]
  })
}
