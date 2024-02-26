import {KEY_STAGEVIEW, META_HASHCODE, META_IGNORE, TEMP_MERGEDATA} from "./constants";

export function parseProject(projectContent) {
  return deserialize(projectContent[KEY_STAGEVIEW])
}

export function parsePage(pageContent) {
  return deserialize(pageContent)
}

let curDictionary: { C, W }
let curRefs: { refs, didMap }

///TODO TEST 此前在load函数中赋值

let K_FROMCLASS = '_F_'
let K_REF = '_R_'


function deserialize<T>(data: { def, refs, D?, consts }): T {
  if (!data || typeof data !== 'object' || typeof data['def'] !== 'object' || typeof data['refs'] !== 'object') {
    //throw new Error(`Invalid data format.`)
    return data
  }
  
  const {def, refs, D, consts} = data
  
  if (consts) {//old version
    K_FROMCLASS = '_from_'
    K_REF = '_ref_'
    curDictionary = {
      C: consts.froms,
      W: {}
    }
  } else {
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
  }
  
  curRefs = {refs, didMap: {}}
  
  // if (nowRefs) {
  //   for (const nm in nowRefs) {
  //     refs[nm][TEMP_CONSTS_IN_REFS] = D
  //   }
  // }
  // if (!merge) {
  //   debugger
  // }
  // Object.keys(refs).forEach(id => {//Replace to real instances
  //   // if(id==='ComStyle_92w5'){
  //   //   debugger
  //   // }
  //   let obj = refs[id], seriName;
  //
  //   if ((seriName = obj[K_FROMCLASS]) !== void 0) {
  //     seriName = curDictionary.C[seriName] || seriName
  //
  //     // delete obj[TEMP_CONSTS_IN_REFS]
  //
  //     const reg = SerializedReg[seriName]
  //     if (!reg) {
  //       return
  //     }
  //
  //     if (reg && reg.proto) {
  //       const rst = newInstance(reg.proto)
  //
  //       rst[K_FROMCLASS] = seriName;
  //       //
  //       rst[TEMP_MERGEDATA] = obj;//Cache in private var
  //       // rst[TEMP_KEYWORDS] = keywords;//Cache in private var
  //
  //       refs[id] = rst
  //     } else {
  //       throw new Error(`Invalid data format.`)
  //     }
  //   }
  // })
  
  const serial = def
  
  return _deserialize(serial)
}

//------------------------------------------------------------------------------------------------------

function merge(serial, cur) {
  const now = _deserialize(serial, cur)
  if (now && typeof now === 'object' && cur) {
    Object.keys(now).forEach(nm => {
      let val = now[nm]
      // if (val) {
      //   val = _deserialize(seContext, val)
      //   let mmetas = val[MetaIgnore]
      //   if (!mmetas || !mmetas[nm]) {
      //     if (val && typeof val === 'object' && !Array.isArray(val)) {
      //       Object.keys(val).forEach(vnm => {
      //         if (!mmetas || !mmetas[vnm]) {
      //           cur[nm] && (cur[nm][vnm] = val[vnm])
      //         }
      //       })
      //     } else {
      //       cur[nm] = val
      //     }
      //   }
      // } else {
      cur[nm] = val
      //}
    })
    return cur
  } else {
    return now
  }
}

function _deserialize(serial, ref?) {
  const {refs, didMap} = curRefs
  
  let processAry = []
  
  function process(serial, ref?) {
    if (Array.isArray(serial)) {
      serial.forEach((item, i) => {
        processAry.push(fn => {
          serial[i] = fn(item)
        })
      })
      
      return serial
    }
    
    let newSerial = serial
    
    if (typeof (newSerial) == 'object' && newSerial) {
      if (newSerial[META_HASHCODE]) {//Some exist components
        didMap[newSerial[META_HASHCODE]] = ref ? ref : newSerial;
        return ref || newSerial
      }
      
      const refKey = newSerial[K_REF]
      
      if (typeof (refKey) == 'string') {//Ref to an object
        if (!ref && didMap[refKey]) {
          return didMap[refKey];
        }
        
        newSerial = refs[refKey]
        didMap[refKey] = ref ? ref : newSerial;
      }
      
      // if(serial?.['_73_']){
      //   debugger
      // }
      //
      // if (!newSerial) {
      //   debugger
      // }
      
      let serialReg, seriName;
      if (seriName = serial[K_FROMCLASS]) {
        
        serialReg = function () {
        }
      }
      
      delete newSerial[K_FROMCLASS]
      
      // let serialData = newSerial[TEMP_MERGEDATA]
      //
      // if (serialData === void 0 && serialReg) {
      //   serialData = newSerial
      //   newSerial = newInstance(serialReg.proto)
      // }
      
      
      let props = getAllProps(newSerial)
      
      if (props.length > 0) {
        const metaIgnore = newSerial[META_IGNORE]
        
        props.forEach(prop => {
          // if(prop==='_51_'){
          //   debugger
          // }
          //
          
          let nprop = curDictionary.W[prop]
          //console.log(nprop, prop)
          let nval = newSerial[prop]
          
          // if(nval==='fangzhou.activity-h5.2021double11.full-return'){
          //   debugger
          // }
          // if (prop === '162') {
          //   debugger
          // }
          
          if (nprop) {
            newSerial[prop] = void 0//delete ori
            delete newSerial[prop]
          } else {
            nprop = prop
          }
          
          if (prop === META_IGNORE) {
            return;
          }
          
          const descr = getPropertyDescriptor(newSerial, nprop)
          
          if (descr && (descr.get && !descr.set) || (metaIgnore && metaIgnore[nprop])) {//Ignore getter(no setter) in target
            return
          }
          
          if (!metaIgnore || !metaIgnore[nprop]) {
            if (metaIgnore) {
              debugger
              //console.log(nprop)
            }
            
            processAry.push(fn => {
              const tval = fn(nval)
              //console.log(tval)
              
              let loadFn;
              
              const descr = getPropertyDescriptor(newSerial, nprop);
              if (descr && (descr.get && !descr.set)) {//Ignore getter(no setter) in target
                return
              }
              
              if (serialReg && typeof ((loadFn = serialReg.load)) == 'function') {
                let tv = loadFn(newSerial, nprop, tval);
                if (tv !== undefined) {
                  newSerial[nprop] = tv
                } else {
                  //delete obj[prop]//ignore undefined value
                }
              } else {
                try {
                  newSerial[nprop] = tval
                } catch (ex) {
                  //console.warn(ex)
                  throw ex;
                }
              }
            })
          }
        })
      }
      
    }
    
    return newSerial
  }
  
  const rtn = process(serial, ref)
  
  for (let i = 0; i < processAry.length; i++) {
    processAry[i]((item) => {
      return process(item)
    })
  }
  
  processAry = void 0
  
  return rtn
}

function newInstance(proto: Function) {
  const rst = new proto();
  
  // const rst = new Object()
  // Object.setPrototypeOf(rst, proto.prototype)
  
  return rst
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
