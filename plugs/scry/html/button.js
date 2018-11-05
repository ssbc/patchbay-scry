const nest = require('depnest')
const { h } = require('mutant')

exports.gives = nest({
  'scry.html.button': true
})

exports.needs = nest({
  'scry.sync.launchModal': 'first'
})

exports.create = function (api) {
  return nest({
    'scry.html.button': ScryButton
  })

  function ScryButton (initialState) {
    // initialState: see /lib/form-state.js

    const button = h('ScryButton', [
      h('button', { 'ev-click': openModal }, 'Scry')
    ])

    return button

    function openModal () {
      api.scry.sync.launchModal(initialState, button)
    }
  }
}
