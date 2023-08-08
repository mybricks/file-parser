import {toJSON} from './to-json/module'
import {toJSON as toGlobalJSON} from './to-json/global'
import {parse} from './rxui-parser'

export function getGlobalJSON(toplViewModel,needClone?:boolean) {
  return toGlobalJSON(toplViewModel,needClone)
}

export function getJSONFromModule(module: { slot, frame },needClone?:boolean) {
  return toJSON(module,needClone)
}

export function getJSONFromRXUIFile(content: {}) {
  const temp = parse(content)
  return getJSONFromModule(temp.mainModule)
}

export function parseFromRXUIFile(json: {}) {
  return parse(json)
}