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
      --gradient: linear-gradient(45deg, hsla(60, 100%, 56%, .5), hsla(280, 100%, 46%, 0.3));
      --texture: left top 0 / 3px radial-gradient(white, #de82e6) repeat ;
      background: var(--texture), var(--gradient);
      background-blend-mode: darken;

      width: 100vh;
      height: 100vh;
      padding: 2rem;
    }
  `)
)
