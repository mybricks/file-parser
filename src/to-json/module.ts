import * as Arrays from '../utils/arrays'

export function toJSON({slot, frame}) {
  let ui: { comAry, style }

  const scanSlot = (slot) => {
    if (slot.comAry) {
      const comAry = []
      slot.comAry.forEach(com => {
        let slots
        if (com.slots) {
          slots = {}
          com.slots.forEach(slot => {
            const comAry = scanSlot(slot)
            if (comAry) {
              slots[slot.id] = comAry
            }
          })
        }
        comAry.push({id: com.runtime.id, def: com.runtime.def, slots})
      })

      return {comAry, style: slot.style}
    }
  }

  ui = scanSlot(slot)

  //-------------------------------------------------------------------------

  const depsReg = []

  const inputsReg = []
  const outputsReg = []

  const pinRelsReg = {}
  const pinProxyReg = {}
  const consReg = {}
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
        const fPin = con.finishPin
        if (!fPin) {
          return
        }

        const pinParent = fPin.parent
        if (pinParent._type === 1) {//toplcom
          const realFPin = fPin.forkedFrom || fPin
          const realParentCom = pinParent.forkedFrom || pinParent

          const startPinParentKey = con.startPin.parent._key
          const finishPinParentKey = con.finishPin.parent._key

          cons.push({
            type: 'com',
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
              const con = {
                type: 'frame',
                frameId: fp.id,
                comId: fp.parent ? fp.parent.id : void 0,
                pinId: forkedFromJointPin.hostId,
                pinType: forkedFromJointPin.type,
                direction: forkedFromJointPin.direction
              }

              cons.push(con)//{frameId, comId, pinId}

              const newIdPre = `${con.comId ? con.comId + '-' : ''}${con.frameId}`

              scanOutputPin(forkedFromJointPin, newIdPre)//scan for it
            } else {
              const comId = fp.parent?._type === 1 ? fp.parent.runtime.id : void 0//toplcom
              cons.push({
                type: 'frame',
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
        consReg[`${idPre}-${pin.hostId}`] = cons
      }
    }
  }

  const scanFrame = (frame) => {
    if (frame.inputPins) {
      frame.inputPins.forEach(pin => {
        let idPre
        if (frame.parent && frame.parent._type === 1) {//toplcom
          idPre = `${frame.parent.id}-${frame.id}`
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
          parentComId: frame.parent?.id,
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

        if (com._autoRun && def.rtType?.match(/^js/)) {
          const idPre = frame.parent ? `${frame.parent.id}-${frame.id}` : '_rootFrame_'
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

  scanFrame(frame)

  return {
    deps: depsReg,
    coms: comsReg,
    slot: ui,
    comsAutoRun,
    inputs: inputsReg,
    outputs: outputsReg,
    cons: consReg,
    pinRels: pinRelsReg,
    pinProxies: pinProxyReg,
  }
}