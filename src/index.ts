import {toJSON} from './to-json/module'
import {toJSON as toGlobalJSON} from './to-json/global'
import {parsePage, parseProject} from './rxui-parser'

export function getGlobalJSON(toplViewModel, needClone?: boolean) {
  return toGlobalJSON(toplViewModel, needClone)
}

export function getJSONFromModule(module: { slot, frame }, needClone?: boolean) {
  return toJSON(module, needClone)
}

export function toJSONFromPageDump(pageJSON: string) {
  const content = JSON.parse(pageJSON).content

  const temp = parsePage(content)

  return getJSONFromModule(temp as any)
}

export function toJSONFromProjectDump(pageJSON: string | { projectContent }) {
  let projectContent

  if (typeof pageJSON === 'string') {
    projectContent = JSON.parse(pageJSON)
  } else if (typeof pageJSON === 'object') {
    projectContent = pageJSON.projectContent
  }

  const temp = parseProject(projectContent)

  const {mainModule, pluginDataset} = temp
  
  const json = getJSONFromModule({
    slot: mainModule.slot,
    frame: mainModule.frame,
    pluginDataset
  })
  
  return json
  
  // return {
  //   global: getGlobalJSON(mainModule.frame),
  //   scenes: [],
  //   pluginDataset
  // }
}

export {parsePage, parseProject}


// export function parseFromRXUIFile(json: {}) {
//   return parse(json)
// }