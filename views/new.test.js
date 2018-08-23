// run:
// $ npx electro views/new.test.js

const h = require('mutant/h')

const NewScry = require('./new')
require('../lib/styles-inject')()

const newScry = NewScry({
})

document.body.appendChild(newScry)
document.head.appendChild(
  h('style', `
    body {
      background: #de82e6;
      padding: 2rem;
    }
  `)
)



