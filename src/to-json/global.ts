import * as Arrays from "../utils/arrays";
import {toFrameJSON, toJSON as toModuleJSON} from './module'

export function toJSON(toplViewModel, needClone?) {
  const comsReg = {}
  const consReg = {}
  const pinRelsReg = {}

  const fxFrames = []

  const scanInputPin = (pin, idPre) => {
    if (pin.rels) {
      pinRelsReg[`${idPre}-${pin.hostId}`] = pin.rels
    }
  }

  const scanOutputPin = (pin, idPre) => {
    // if(pin.title==='打开'){
    //   debugger
    // }

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
            id:con.id,
            type: 'com',
            frameKey,
            startPinParentKey,
            finishPinParentKey,
            comId: realParentCom.runtime.id,
            def: realParentCom.runtime.def,
            pinId: realFPin.hostId,
            pinType: realFPin.type,
            direction: realFPin.direction,
            extBinding: realFPin.extBinding,
            isIgnored:con.isIgnored
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
                id:con.id,
                type: 'frame',
                frameKey,
                startPinParentKey,
                frameId: fp.id,
                comId: fp.parent?.runtime.id,
                pinId: pinHostId,
                pinType: 'joint',
                direction: forkedFromJointPin.direction,
                isIgnored:con.isIgnored
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
                id:con.id,
                type: 'frame',
                frameKey,
                startPinParentKey,
                frameId: fp.id,
                comId,
                pinId: realFPin.hostId,
                pinType: realFPin.type,
                direction: realFPin.direction,
                isIgnored:con.isIgnored
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

  if (toplViewModel.varComAry) {//全局变量
    toplViewModel.varComAry.forEach(com => {
      const rt = com.runtime
      const def = rt.def

      const configPinIdAry = []
      const inputPinIdAry = []
      const outPinIdAry = []

      const geo = rt.geo

      const model = needClone ? JSON.parse(JSON.stringify(rt.model)) : rt.model

      comsReg[rt.id] = {
        id:rt.id,
        def,
        title: rt.title,
        model,
        reservedEditorAry: geo ? geo.reservedEditorAry : void 0,
        configs: configPinIdAry,
        inputs: inputPinIdAry,
        outputs: outPinIdAry
      }
      // if(com.title==='对话框'){
      //   debugger
      // }

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
        com.outputPinExts,
        com.outputPinNexts)
      // if (com.runtime.def.rtType === 'js') {
      //
      // }
    })
  }

  if (toplViewModel.frames) {//全局Fx
    toplViewModel.frames.forEach(frame => {
      if (frame.type === 'fx') {
        const frameJSON = toFrameJSON(frame,void 0,needClone)
        fxFrames.push(frameJSON)
      }
    })
  }

  return {
    comsReg, consReg, pinRels: pinRelsReg, fxFrames
  }
}