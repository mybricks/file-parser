import {KEY_STAGEVIEW, META_HASHCODE, META_IGNORE} from "./constants";

export function parse(pageData) {
  let mainModule
  const requireComs: string[] = []

  for (let viewName in pageData) {
    if (viewName === KEY_STAGEVIEW) {
      const now = deserialize(pageData[viewName])
      mainModule = now.mainModule
    }
  }

  const scanSlot = slot => {
    if (slot.comAry) {
      slot.comAry.forEach(com => {
        const rt = com.runtime, def = rt.def
        if (def) {
          const key = def.namespace + '@' + def.version

          if (requireComs.indexOf(key) <= 0) {
            requireComs.push(key)
          }
        }

        if (com.slots) {
          com.slots.forEach(slot => {
            scanSlot(slot)
          })
        }
      })
    }
  }

  mainModule.slot.slots.forEach(slot => {
    scanSlot(slot)
  })

  return {
    mainModule: {
      slot: mainModule.slot.slots[0],
      frame: mainModule.frame.frames[0],
    }, requireComs
  }
}

let curDictionary: { C, W }
let curRefs: { refs, didMap }

let K_FROMCLASS = '_F_'
let K_REF = '_R_'

function deserialize<T>(data: { def, refs, D }): T {
  if (typeof data !== 'object' || typeof data['def'] !== 'object' || typeof data['refs'] !== 'object') {
    throw new Error(`Invalid data format.`)
  }

  const {def, refs, D} = data

  if (D) {
    if (D.W) {
      const kw = {}
      Object.keys(D.W).forEach(key => {
        kw[D.W[key]] = key
      })
      D.W = kw

      curDictionary = D
    } else {
      curDictionary = Object.assign({W: {}}, D)
    }
  } else {
    curDictionary = {C: {}, W: {}} as any
  }

  curRefs = {refs, didMap: {}}

  const serial = def

  return _deserialize(serial)
}

function _deserialize(serial, ref?) {
  const {refs, didMap} = curRefs
  if (Array.isArray(serial)) {
    return serial.map(to => _deserialize(to))
  }

  if (typeof (serial) == 'object' && serial) {
    if (serial[META_HASHCODE]) {//Some exist components
      didMap[serial[META_HASHCODE]] = ref ? ref : serial;
      return ref || serial
    }
    const refKey = serial[K_REF]
    if (typeof (refKey) == 'string') {//Ref to an object
      // if (refKey.match(/DiagramModel_.*/gi)) {
      //   console.log(SerializedReg)
      //   debugger
      // }

      if (!ref && didMap[refKey]) {
        return didMap[refKey];
      }
      serial = refs[refKey]
      didMap[refKey] = ref ? ref : serial;
    }

    //console.log(serial)
    // if(serial?.['_F_']==='xg.desn.sdk.ComStyle'){
    //   debugger
    // }

    let serialReg, seriName;
    if (seriName = serial[K_FROMCLASS]) {

      serialReg = function () {
      }
    }

    delete serial[K_FROMCLASS]


    let props = getAllProps(serial)

    if (props.length > 0) {
      const metaIgnore = serial[META_IGNORE]

      props.forEach(prop => {
        // if(prop==='_44_'){
        //   debugger
        // }
        let nprop = curDictionary.W[prop]
        //console.log(nprop, prop)
        let nval = serial[prop]

        if (nprop) {
          serial[prop] = void 0//delete ori
          delete serial[prop]
        } else {
          nprop = prop
        }


        if (prop === META_IGNORE) {
          return;
        }
        const descr = getPropertyDescriptor(serial, nprop);
        if (descr && (descr.get && !descr.set) || (metaIgnore && metaIgnore[nprop])) {//Ignore getter(no setter) in target
          return
        }

        if (!metaIgnore || !metaIgnore[nprop]) {
          if (metaIgnore) {
            debugger
            console.log(nprop)
          }

          const tval = _deserialize(nval)

          // const descr = getPropertyDescriptor(serial, nprop);
          // if (descr && (descr.get && !descr.set)) {//Ignore getter(no setter) in target
          //   return
          // }

          try {
            serial[nprop] = tval
          } catch (ex) {
            //console.warn(ex)
            throw ex;
          }

        }
      })
    }
  }
  return serial;
}

function getAllProps(obj, notFunction?: boolean) {
  let props = [];
  do {
    if (obj == Object.prototype || obj == Function.prototype) {
      break;
    }
    try {
      props = props.concat(Object.getOwnPropertyNames(obj));
    } catch (ex) {
      console.error(ex)
      debugger
    }

  } while (obj = Object.getPrototypeOf(obj));
  return props.filter(p => {
    if (!notFunction || notFunction && typeof (obj[p]) !== 'function') {
      return p != 'constructor' && !/^__.+/g.test(p)
    }
  });
}

function getPropertyDescriptor(target, prop) {
  let descr = Object.getOwnPropertyDescriptor(target, prop)
  if (descr === undefined) {
    let proto = target;
    while (descr === undefined && (proto = Object.getPrototypeOf(proto)) != null && proto !== Object.prototype) {
      descr = Object.getOwnPropertyDescriptor(proto, prop)
    }
  }
  return descr;
}