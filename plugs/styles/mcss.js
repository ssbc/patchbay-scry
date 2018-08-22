const path = require('path')
// const { basename } = path
const readDirectory = require('read-directory')
const { each } = require('libnested')
const nest = require('depnest')
const getMaramaMCSS = require('marama/lib/get-mcss')

const contents = readDirectory.sync(path.join(__dirname, '../..'), {
  extensions: false,
  filter: '**/*.mcss',
  ignore: '**/node_modules/**'
})

exports.gives = nest('styles.mcss')

exports.create = function (api) {
  return nest('styles.mcss', mcss)

  function mcss (sofar = {}) {
    sofar.marama = getMaramaMCSS()
    
    each(contents, (content, [filename]) => {
      // const name = basename(filename)
      sofar[`scry-${filename}`] = content
    })

    return sofar
  }
}
