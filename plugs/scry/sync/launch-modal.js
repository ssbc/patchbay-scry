const nest = require('depnest')
const { h, Value } = require('mutant')
const Scuttle = require('scuttle-poll')
const ScryNew = require('../../../views/new')

exports.gives = nest({
  'scry.sync.launchModal': true
})

exports.needs = nest({
  'about.async.suggest': 'first',
  'about.html.avatar': 'first',
  'app.html.modal': 'first',
  'app.sync.goTo': 'first',
  'keys.sync.id': 'first',
  'sbot.obs.connection': 'first'
})

exports.create = function (api) {
  return nest({
    'scry.sync.launchModal': GatheringLaunchModal
  })

  function GatheringLaunchModal (initialState, root) {
    // initialState: see /lib/form-state.js

    const isOpen = Value(false)

    const form = ScryNew({
      scuttle: Scuttle(api.sbot.obs.connection),
      myKey: api.keys.sync.id(),
      avatar: api.about.html.avatar,
      suggest: { about: api.about.async.suggest },
      afterPublish: (msg) => {
        isOpen.set(false)
        api.app.sync.goTo(msg)
      },
      onCancel: () => isOpen.set(false)
    })

    const modal = h('ScryLaunchModal', [
      api.app.html.modal(form, { isOpen })
    ])
    isOpen(open => {
      if (open) root.appendChild(modal)
      else modal.remove()
    })

    isOpen.set(true)
    return true
  }
}
