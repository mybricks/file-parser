import {toJSON} from './to-json/module'
import {parse} from './rxui-parser'

export function getJSONFromModule(module: { slot, frame }) {
  return toJSON(module)
}

export function getJSONFromRXUIFile(content: {}) {
  const temp = parse(content)
  return getJSONFromModule(temp.mainModule)
}

export function parseFromRXUIFile(json: {}) {
  return parse(json)
}