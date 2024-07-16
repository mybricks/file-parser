import {toJSON} from './to-json/forUIModule'
import {toJSON as toGlobalJSON} from './to-json/forUIGlobal'
import {toJSON as toServiceJSON} from './to-json/forService'
import {parsePage, parseProject} from './rxui-parser'

export function getGlobalJSON(toplViewModel, opts?: {
  needClone?: boolean,
  withMockData?: boolean
}) {
  return toGlobalJSON(toplViewModel, opts || {})
}

export function getServiceJSON(toplViewModel, opts?: {
  needClone?: boolean,
  withMockData?: boolean
}) {
  return toServiceJSON(toplViewModel, opts || {})
}

export function getJSONFromModule(module: {
                                    slot,
                                    frame
                                  },
                                  opts?: {
                                    forMPA?: boolean,
                                    needClone?: boolean,
                                    withMockData?: boolean,
                                    onlyDiff?: {
                                      getComDef: () => {}
                                    }
                                  }) {
  if (opts?.forMPA) {
    const {slot, frame} = module
    
    const json = []
    if (slot.slots && slot.slots.length > 0) {
      slot.slots.forEach((curSlot, idx) => {
        const curFrame = frame === null || frame === void 0 ? void 0 : frame.frameAry.find(frame => {
          if (frame.id === curSlot.id) {
            return frame;
          }
        })
        
        json.push(toJSON({
          slot: curSlot,
          frame: curFrame
        }, opts || {}))
      })
    }
    
    return json
  } else {
    return toJSON(module, opts || {})
  }
}

export function toJSONFromPageDump(pageJSON: string, opts?: { forMPA: boolean }) {
  const content = JSON.parse(pageJSON).content
  
  const temp = parsePage(content)
  
  return getJSONFromModule(temp as any, opts)
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