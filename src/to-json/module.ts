import * as Arrays from '../utils/arrays'
import pkg from '../../package.json'

export function toJSON({slot, frame}) {
  let ui: { title, comAry, style }

  const scanSlot = (slot) => {
    // let sid
    // if (slot.parent) {
    //   sid = `${slot.parent.runtime.id}-${slot.id}`
    // } else {
    //   sid = slot.id
    // }
    // slotsReg[sid] = {
    //   type: slot.type
    // }

    if (slot.comAry) {
      const comAry = []
      slot.comAry.forEach(com => {
        let slots
        if (com.slots) {
          slots = {}
          com.slots.forEach(slot => {
            const slotDef = scanSlot(slot)
            if (slotDef) {
              slots[slot.id] = slotDef
            }
          })
        }

        comAry.push({id: com.runtime.id, def: com.runtime.def, slots})
      })

      return {
        id: slot.id,
        type: slot.type,
        title: slot.title,
        comAry,
        style: slot.style
      }
    }
  }

  ui = scanSlot(slot)

  //-------------------------------------------------------------------------

  const depsReg = []

  const _inputsReg = []
  const _outputsReg = []

  const inputsReg = []
  const outputsReg = []

  const pinRelsReg = {}
  const pinProxyReg = {}
  const consReg = {}
  //const slotsReg = {}
  const comsReg = {}
  const comsAutoRun = {}

  const scanInputPin = (pin, idPre) => {
    if (pin.rels) {
      pinRelsReg[`${idPre}-${pin.hostId}`] = pin.rels
    }

    if (pin.proxyPin) {
      const comOrFrame = pin.proxyPin.parent
      if (comOrFrame._type === 0) {//frame
        const frameId = comOrFrame.id

        if (comOrFrame) {

        }

        pinProxyReg[`${idPre}-${pin.hostId}`] = {
          type: 'frame',
          frameId,
          pinId: pin.proxyPin.hostId
        }
      }
    }
  }

  const scanOutputPin = (pin, idPre) => {
    if (pin.conAry) {
      const cons = []
      pin.conAry.forEach(con => {
        let frameKey

        const fPin = con.finishPin
        if (!fPin) {
          return
        }

        const frame = con.parent.parent
        if (frame) {//frame 可能不存在（对应的diagramModelparent为空)
          if (frame.parent) {
            if (frame.parent._type === 1) {
              frameKey = `${frame.parent.runtime.id}-${frame.id}`
            } else {
              frameKey = `${frame.id}`
            }
          } else {
            frameKey = `_rootFrame_`
          }
        } else {
          debugger
        }


        const pinParent = fPin.parent
        if (pinParent._type === 1) {//toplcom
          const realFPin = fPin.forkedFrom || fPin
          const realParentCom = pinParent.forkedFrom || pinParent

          const startPinParentKey = con.startPin.parent._key
          const finishPinParentKey = con.finishPin.parent._key

          cons.push({
            type: 'com',
            frameKey,
            startPinParentKey,
            finishPinParentKey,
            comId: realParentCom.runtime.id,
            def: realParentCom.runtime.def,
            pinId: realFPin.hostId,
            pinType: realFPin.type,
            direction: realFPin.direction,
            extBinding: realFPin.extBinding
          })
        } else {
          const realFPin = fPin.forkedFrom || fPin

          const fp = realFPin.parent
          if (fp._type === 0) {//frame
            const forkedFromJointPin = realFPin.forkedAsJoint//joint
            if (forkedFromJointPin) {
              const pinHostId = forkedFromJointPin.from?.hostId || forkedFromJointPin.hostId

              const startPinParentKey = con.startPin.parent?._key

              const nCon = {
                type: 'frame',
                frameKey,
                startPinParentKey,
                frameId: fp.id,
                comId: fp.parent?.runtime.id,
                pinId: pinHostId,
                pinType: 'joint',
                direction: forkedFromJointPin.direction
              }

              cons.push(nCon)//{frameId, comId, pinId}

              const newIdPre = `${nCon.comId ? nCon.comId + '-' : ''}${nCon.frameId}`

              scanOutputPin(forkedFromJointPin, newIdPre)//scan for it
            } else {
              // if (!realFPin.hostId) {
              //   debugger
              // }
              const startPinParentKey = con.startPin.parent?._key

              const comId = fp.parent?._type === 1 ? fp.parent.runtime.id : void 0//toplcom
              cons.push({
                type: 'frame',
                frameKey,
                startPinParentKey,
                frameId: fp.id,
                comId,
                pinId: realFPin.hostId,
                pinType: realFPin.type,
                direction: realFPin.direction
              })//{frameId, comId, pinId}
            }
          }
        }
      })

      if (cons.length > 0) {
        let pinHostId
        if (pin.from && pin.from.hostId) {//joint
          pinHostId = pin.from.hostId
        } else {
          pinHostId = pin.hostId
        }

        // if(!pinHostId){
        //   debugger
        // }

        consReg[`${idPre}-${pinHostId}`] = cons
      }
    }
  }

  const scanFrame = (frame) => {
    if (frame._inputPins) {
      frame._inputPins.forEach(pin => {
        let idPre
        if (frame.parent && frame.parent._type === 1) {//toplcom
          idPre = `${frame.parent.runtime.id}-${frame.id}`
        } else if (frame.parent) {
          idPre = frame.id
        } else {
          idPre = '_rootFrame_'//_rootFrame_
        }

        scanOutputPin(pin, idPre)

        scanInputPin(pin, idPre)//scan rels

        if (!frame.parent) {//root
          _inputsReg.push({
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: pin.schema,
            extValues: pin.extValues
          })
        }
      })
    }

    if (frame.inputPins) {
      frame.inputPins.forEach(pin => {
        let idPre
        if (frame.parent && frame.parent._type === 1) {//toplcom
          idPre = `${frame.parent.runtime.id}-${frame.id}`
        } else if (frame.parent) {
          idPre = frame.id
        } else {
          idPre = '_rootFrame_'//_rootFrame_
        }

        scanOutputPin(pin, idPre)

        scanInputPin(pin, idPre)//scan rels

        if (!frame.parent) {//root
          inputsReg.push({
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: pin.schema,
            extValues: pin.extValues
          })
        }
      })
    }

    if (frame._outputPins) {
      frame._outputPins.forEach(pin => {
        if (!frame.parent) {//root
          _outputsReg.push({
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: pin.schema
          })
        }
      })
    }

    if (frame.outputPins) {
      frame.outputPins.forEach(pin => {
        if (!frame.parent) {//root
          outputsReg.push({
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: pin.schema
          })
        }

        if(pin.type==='event'){
          let idPre = '_rootFrame_'//_rootFrame_
          scanOutputPin(pin, idPre)
        }
      })
    }

    // if (frame.outputJoints) {
    //   frame.outputJoints.forEach(pin => {
    //     if (!frame.parent) {//root
    //       outputsReg.push({
    //         id: pin.hostId,
    //         title: pin.title,
    //         type: pin.type,
    //         schema: pin.schema
    //       })
    //     }
    //   })
    // }

    if (frame.comAry) {
      frame.comAry.forEach(com => {
        const rt = com.runtime
        const def = rt.def
        if (!depsReg.find(now => now.namespace === def.namespace && now.version === def.version)) {
          depsReg.push(def)
        }

        const configPinIdAry = []
        const inputPinIdAry = []
        const outPinIdAry = []

        const geo = rt.geo

        comsReg[rt.id] = {
          def,
          frameId: frame.parent ? frame.id : void 0,
          parentComId: frame.parent?.runtime?.id,
          title: rt.title,
          model: rt.model,
          reservedEditorAry: geo ? geo.reservedEditorAry : void 0,
          configs: configPinIdAry,
          inputs: inputPinIdAry,
          outputs: outPinIdAry
        }
        // if(com.title==='对话框'){
        //   debugger
        // }

        if (com.configPins) {
          com.configPins.forEach(pin => {
            configPinIdAry.push(pin.hostId)
          })
        }

        Arrays.each(pin => {
            scanInputPin(pin, rt.id)
            inputPinIdAry.push(pin.hostId)
          }, com.inputPins,
          com.inputPinsInModel,
          com.inputPinExts,
        )

        Arrays.each(pin => {
            scanOutputPin(pin, rt.id)
            outPinIdAry.push(pin.hostId)
          }, com.outputPins,
          com.outputPinsInModel,
          com.outputPinExts)
        // if (com.runtime.def.rtType === 'js') {
        //
        // }

        if (rt._autoRun && def.rtType?.match(/^js/)) {
          let idPre
          if (frame.parent) {
            if (frame.parent.runtime) {
              idPre = `${frame.parent.runtime.id}-${frame.id}`
            } else {
              idPre = frame.id
            }
          } else {
            idPre = '_rootFrame_'
          }
          //const idPre = frame.parent ? `${frame.parent.runtime.id}-${frame.id}` : '_rootFrame_'
          let ary = comsAutoRun[idPre]
          if (!ary) {
            ary = comsAutoRun[idPre] = []
          }
          ary.push({
            id: rt.id,
            def
          })
        }

        if (com.frames) {
          com.frames.forEach(frame => {
            scanFrame(frame)
          })
        }
      })
    }

    if (frame.frameAry) {
      frame.frameAry.forEach(frame => {
        scanFrame(frame)
      })
    }
  }

  if (frame) {
    scanFrame(frame)
  }

  return {
    '-v': pkg.version,
    id: ui.id,
    title: ui.title,
    deps: depsReg,
    coms: comsReg,
    slot: ui,
    //slotsReg,
    comsAutoRun,
    _inputs: _inputsReg,
    _outputs: _outputsReg,
    inputs: inputsReg,
    outputs: outputsReg,
    cons: consReg,
    pinRels: pinRelsReg,
    pinProxies: pinProxyReg,
  }
}