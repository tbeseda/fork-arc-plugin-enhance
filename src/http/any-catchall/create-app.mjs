import arc from '@architect/functions'
import importTransform from '@enhance/import-transform'
import styleTransform from '@enhance/enhance-style-transform'
import loadAppConfig from '../../../app-loader/src/index.js' // @enhance/app-loader
import createEnhanceApp from '../../../app-core/src/index.js' // @enhance/app-core

import { findHeadFn } from './util.mjs'

export default async function loadAndCreateApp ({ basePath, DEBUG = 0 }) {
  const head = await findHeadFn(basePath)
  const config = await loadAppConfig({ basePath, debug: DEBUG > 1 })
  const app = createEnhanceApp({
    ...config,
    head,
    ssrOptions: {
      scriptTransforms: [ importTransform({ lookup: arc.static }) ],
      styleTransforms: [ styleTransform ],
    },
    state: {}, // * New
    debug: DEBUG > 1,
  })
  return app
}
