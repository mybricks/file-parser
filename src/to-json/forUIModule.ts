import * as Arrays from '../utils/arrays'
import pkg from '../../package.json'
import {getJSONDiff} from "../utils/json";
import {COM_NS_FX, COM_NS_MODULE, COM_NS_SELECTION, COM_NS_VAR, OUTPUT_PIN_ID_CONFIG} from "../constants";

export function toJSON({slot, frame}, opts: {
  forDebug?: boolean,
  needClone?: boolean,
  withMockData?: boolean,
  withIOSchema?: boolean,
  withDiagrams?: boolean,
  onlyDiff?: {
    getComDef: () => {}
  }
}) {
  const depsReg = []
  const comsReg = {}

  //console.log('withIOSchema....',opts.withIOSchema)

  // if(slot.title==='主场景'){
  //   debugger
  // }

  let slotJSON
  if (slot) {
    slotJSON = toSlotJSON(slot, {depsReg, comsReg}, frame, opts)
  }

  let frameJSON
  if (frame) {
    frameJSON = toFrameJSON(frame, {depsReg, comsReg}, opts)
  }

//   if(comsReg['u_C6zfO']){
// debugger
//   }

  return Object.assign({
      '-v': pkg.version,
      deps: depsReg,
      coms: comsReg,
    },
    frameJSON || {},
    slotJSON ? {
      id: slotJSON.id,
      title: slotJSON.title,
      slot: slotJSON
    } : {}
  )
}

export function toSlotJSON(slot, {depsReg, comsReg}, frame, opts: {
  forDebug?: boolean,
  needClone?: boolean,
  withMockData?: boolean
}) {
  let ui: {
    id,
    title,
    type,
    comAry,
    style
  }

  const scanSlot = (slot, asRoot?) => {
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
        const rt = com.runtime

        if (!frame) {//没有toplview的情况
          const def = rt.def

          if (def.namespace === COM_NS_SELECTION) {//忽略选区组件
            return
          }

          if (def.namespace === COM_NS_MODULE) {//模块
            const moduleId = com.proxySlot.id
            if (!depsReg.find(now => now.namespace === def.namespace && now.version === def.version && now.moduleId === moduleId)) {
              depsReg.push({...def, moduleId})
            }
          } else if (!depsReg.find(now => now.namespace === def.namespace && now.version === def.version)) {
            depsReg.push(def)
          }

          const model = opts.needClone ? JSON.parse(JSON.stringify(rt.model)) : rt.model
          const comStyle = model.style

          const style = {} as any

          const geoPtStyle = rt.geo.parent?.style

          if (comStyle) {
            if (geoPtStyle?.layout === 'absolute' || geoPtStyle?.layout === 'smart') {
              delete comStyle['marginTop']
              delete comStyle['marginRight']
              delete comStyle['marginBottom']
              delete comStyle['marginLeft']
            }

            if (comStyle.position === 'absolute') {
              style.position = 'absolute'
            }

            if (comStyle.width === 'auto' || comStyle.width === 'fit-content') {
              comStyle.widthAuto = true
            }

            if (comStyle.height === 'auto' || comStyle.height === 'fit-content') {
              comStyle.heightAuto = true
            }

            style.width = comStyle.widthFact
            style.height = comStyle.heightFact
          } else {
            model.style = {}//兼容
          }

          if (rt.id === 'u_rS3CQ') {
            debugger
          }

          comsReg[rt.id] = {
            id: rt.id,
            def,
            name: com.name,
            title: rt.title,
            style,
            model
          }
        }

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

        // if(rt.id==='u_QrQxJ'){
        //   debugger
        // }

        if (rt.topl) {
          const topl = rt.topl
          if (topl.frames) {
            topl.frames.forEach(frame => {
              slots = slots || {}

              if (!slots[frame.id]) {//兼容之前的数据（例如因为defer的原因，upload组件之前在UI中没有对应的slot）
                slots[frame.id] = {
                  id: frame.id,
                  title: frame.title,
                  type: frame.type,
                  comAry: [],
                  style: {}
                }
              }
            })
          }
        }

        comAry.push({
          id: com.runtime.id,
          name: com.name,
          def: com.runtime.def,
          slots
        })
      })

      // const width = slot.$el ? slot.$el.offsetWidth : slot.width
      // const height = slot.$el ? slot.$el.offsetHeight : slot.height

      // if(slot.title==='模块1'){
      //   debugger
      //
      //   console.log(slot.style)
      // }

      const widthFact = slot.style.widthFact
      const heightFact = slot.style.heightFact

      // const style = Object.assign({},
      //   slot.style, {
      //     width: widthFact,
      //     height: slot.showType === 'module' || slot.type === 'module' ? heightFact : undefined
      //   })

      const style = Object.assign({},
        slot.style, {
          width: widthFact,
          height: heightFact
        })

      //删除模块对应的位置信息
      delete style.left
      delete style.top
      delete style.zoom
      delete style.marginLeft
      delete style.marginRight

      if (asRoot && opts.forDebug) {//调试模式下，删除root的滚动条、以便于引擎控制滚动效果
        delete style.overflow
        delete style.overflowX
        delete style.overflowY
      }

      return {
        id: slot.id,
        title: slot.title,
        type: slot.type,
        showType: slot.showType,
        layoutTemplate: slot.layoutTemplate,
        comAry,
        style
      }
    }
  }

  if (slot) {
    ui = scanSlot(slot, true)
  }

  return ui
}

export function toFrameJSON(frame, regs: {
  depsReg,
  comsReg,
}, opts: {
  forDebug?: boolean,
  needClone?,
  withMockData?,
  withIOSchema?,
  withDiagrams?,
  onlyDiff?: {
    getComDef: () => {}
  }
}) {
  const depsReg = regs.depsReg || []
  const comsReg = regs.comsReg || {}

  const _inputsReg = []
  const _outputsReg = []

  const inputsReg = []
  const outputsReg = []

  const pinRelsReg = {}
  const pinProxyReg = {}
  const pinValueProxyReg = {}
  const consReg = {}
  //const slotsReg = {}

  const comsAutoRun = {}

  const scanInputPin = (pin, idPre) => {
    // if(pin.title==='打开'&&pin.proxyPin?._todo_){
    //   debugger
    // }

    // console.log(pin.title)
    //
    // if(pin.title==='新增输入项1'){
    //   debugger
    // }

    if (pin.rels) {
      pinRelsReg[`${idPre}-${pin.hostId}`] = pin.rels
    } else {
      if (!pin.parent) {
        debugger
      }

      if (pin.parent?._type === 1) {//component
        const parentCom = pin.parent
        if (parentCom.runtime.def.namespace === COM_NS_MODULE) {//模块组件
          const ioProxyForCall = parentCom.ioProxyForCall
          if (ioProxyForCall && ioProxyForCall.frame) {
            const proxyPin = ioProxyForCall.frame.inputPins?.find(ipt => ipt.id === pin.hostId)
            if (proxyPin && proxyPin.rels) {
              pinRelsReg[`${idPre}-${pin.hostId}`] = proxyPin.rels
            }
          }
        }
      }
    }

    if (pin.proxyScenePin) {
      const {sceneId, hostId} = pin.proxyScenePin
      pinProxyReg[`${idPre}-${pin.hostId}`] = {
        type: 'frame',
        frameId: sceneId,
        pinId: hostId
      }
    }

    if (pin.proxyMyFramePin) {
      const {frameId, pinId} = pin.proxyMyFramePin
      pinProxyReg[`${idPre}-${pin.hostId}`] = {
        type: 'myFrame',
        frameId,
        pinId
      }
    }

    if (pin.proxyPin) {
      if (pin.proxyPin._todo_) {
        const {frameId, pinId, pinHostId} = pin.proxyPin
        pinProxyReg[`${idPre}-${pin.hostId}`] = {
          type: 'frame',
          frameId,
          pinId: pinHostId
        }
      } else {
        const comOrFrame = pin.proxyPin.parent
        if (comOrFrame && comOrFrame._type === 0) {//frame
          const frameId = comOrFrame.id

          if (pinProxyReg[`${idPre}-${pin.hostId}`]) {
            debugger
          }

          const proxyFrame = pin.proxyPin.parent

          if (proxyFrame.isTypeOfExtension?.()) {//考虑到业务模块的情况，这里是连接到模块的输出项，用来做标识
            pinProxyReg[`${idPre}-${pin.hostId}`] = {
              type: proxyFrame.type,
              frameId,
              frameName: proxyFrame.name,
              pinId: pin.proxyPin.hostId
            }
          } else {
            pinProxyReg[`${idPre}-${pin.hostId}`] = {
              type: 'frame',
              frameId,
              pinId: pin.proxyPin.hostId
            }
          }
        }
      }
    }

    if (pin.proxyPinValue) {
      const comOrFrame = pin.proxyPinValue.parent
      if (comOrFrame && comOrFrame._type === 0) {//frame
        const frameId = comOrFrame.id

        pinValueProxyReg[`${idPre}-${pin.hostId}`] = {
          type: 'frame',
          frameId,
          pinId: pin.proxyPinValue.hostId
        }
      }
    }

    if (pin.editor) {

    }
  }

  const scanOutputPin = (pin, idPre) => {
    if (pin.proxyPin) {
      if (pin.proxyPin._todo_) {
        const {frameId, pinId, pinHostId} = pin.proxyPin

        pinProxyReg[`${idPre}-${pin.hostId}`] = {
          type: 'frame',
          frameId,
          pinId: pinHostId
        }
      } else {
        const comOrFrame = pin.proxyPin.parent
        if (comOrFrame && comOrFrame._type === 0) {//frame
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

    if (pin.conAry?.length > 0) {
      const cons = []
      pin.conAry.forEach(con => {
        let frameKey,
          targetFrameKey//组件实际所在的frame，例如frameOut组件可能是上级frame的

        const fPin = con.finishPin
        if (!fPin) {
          return
        }

        if (cons.find(tc => tc.id === con.id)) {
          debugger
          return//重复连接
        }

        // if(fPin.title==='获取'){
        //   debugger
        // }

        let timerPinInputId

        if (!fPin.parent) {
          debugger
        }

        if (fPin.parent) {
          if (fPin.parent.timerInputPin) {
            timerPinInputId = fPin.parent.timerInputPin.id
          }
        }

        const frame = con.parent?.parent
        if (frame) {//frame 可能不存在（对应的diagramModelparent为空)
          frameKey = getFrameKey(frame)
        } else {
          //debugger
        }

        if (fPin.proxyPinValue) {//frameInput
          targetFrameKey = getFrameKey(fPin.proxyPinValue.parent)
        } else {
          //debugger

          targetFrameKey = frameKey
        }

        // if(fPin.parent._type === 1&&fPin.parent.isFrameIn()){//frameOutput
        //   targetFrameKey = getFrameKey(fPin.parent.parent)
        // }else{
        //   targetFrameKey = frameKey
        // }

        const pinParent = fPin.parent
        if (pinParent?._type === 1) {//toplcom
          const realFPin = fPin.forkedFrom || fPin
          const realParentCom = pinParent.forkedFrom || pinParent

          //realParentCom._todo&&realParentCom.comId 全局变量
          if (realParentCom && (realParentCom.runtime || realParentCom._todo_ && realParentCom.comId)) {
            // if(!realParentCom.runtime){
            //   debugger
            // }
            const realParentComRT = realParentCom.runtime

            const parentComId = realParentComRT?.id || realParentCom.comId
            const parentComDef = realParentComRT?.def || realParentCom.def

            const startPinParentKey = con.startPin.parent._key
            const finishPinParentKey = con.finishPin.parent._key

            const conReg = {
              id: con.id,
              type: 'com',
              frameKey,
              targetFrameKey,
              startPinParentKey,
              finishPinParentKey,
              comId: parentComId,
              def: parentComDef,
              timerPinInputId,
              pinId: realFPin.hostId,
              pinType: realFPin.type,
              direction: realFPin.direction,
              extData:con.extData,
              extBinding: realFPin.extBinding,
              isIgnored: opts?.forDebug ? con.isIgnored : void 0,
              isBreakpoint: opts?.forDebug ? con.isBreakpoint : void 0
            }

            if (realFPin.hostId === OUTPUT_PIN_ID_CONFIG) {//配置组件,增加configBindWith
              if (realParentComRT) {
                const configBindWith = realParentComRT.model?.configBindWith
                if (Array.isArray(configBindWith)) {
                  const toplKey = fPin.parent._key
                  const bindItem = configBindWith.find(item => item.toplKey === toplKey)

                  if (bindItem) {
                    conReg['configBindWith'] = {
                      toplKey,
                      title: bindItem.title,
                      bindWith: bindItem.bindWith
                    }
                  }
                }
              }
            }

            if (con.startPin.isStarter) {
              delete conReg.startPinParentKey
            }

            cons.push(conReg)
          }
        } else {
          const realFPin = fPin.forkedFrom || fPin

          const fp = realFPin.parent
          if (fp._type === 0) {//frame
            const forkedFromJointPin = realFPin.forkedAsJoint//joint
            if (forkedFromJointPin) {
              const pinHostId = forkedFromJointPin.from?.hostId || forkedFromJointPin.hostId

              const startPinParentKey = con.startPin.parent?._key

              const nCon = {
                id: con.id,
                type: 'frame',
                frameKey,
                startPinParentKey,
                frameId: fp.id,
                comId: fp.parent?.runtime.id,
                pinId: pinHostId,
                pinType: 'joint',
                direction: forkedFromJointPin.direction,
                isIgnored: opts?.forDebug ? con.isIgnored : void 0,
                isBreakpoint: opts?.forDebug ? con.isBreakpoint : void 0
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
                id: con.id,
                type: 'frame',
                frameKey,
                startPinParentKey,
                frameId: fp.id,
                comId,
                pinId: realFPin.hostId,
                pinType: realFPin.type,
                direction: realFPin.direction,
                isIgnored: opts?.forDebug ? con.isIgnored : void 0,
                isBreakpoint: opts?.forDebug ? con.isBreakpoint : void 0
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
//debugger
        consReg[`${idPre}-${pinHostId}`] = cons
      }
    }
  }

  const scanFrame = (frame) => {
    const defs = {
      id: frame.id,
      title: frame.title,
      itemWrap: frame.itemWrapF,
      wrap: frame.wrapF,
      _inputs: [],
      _outputs: [],
      inputs: [],
      outputs: []
    }

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
            schema: opts.withIOSchema ? pin.schema : void 0,
            extValues: pin.extValues
          })
        }

        defs._inputs.push({
          id: pin.hostId,
          title: pin.title,
          type: pin.type,
          schema: opts.withIOSchema ? pin.schema : void 0,
          extValues: pin.extValues
        })
      })
    }

    // console.log(frame.title)
    //

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
            schema: opts.withIOSchema ? pin.schema : void 0,
            extValues: pin.extValues,
            mockData: opts.withMockData ? pin.mockData : void 0,//添加mock数据
            mockDataType: opts.withMockData ? pin.mockDataType : void 0,
            editor: pin.editor
          })
        }

        defs.inputs.push(
          {
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: opts.withIOSchema ? pin.schema : void 0,
            extValues: pin.extValues,
            mockData: opts.withMockData ? pin.mockData : void 0,//添加mock数据
            mockDataType: opts.withMockData ? pin.mockDataType : void 0,
            editor: pin.editor
          }
        )
      })
    }

    if (frame._outputPins) {
      frame._outputPins.forEach(pin => {
        if (!frame.parent) {//root
          _outputsReg.push({
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: opts.withIOSchema ? pin.schema : void 0,
          })
        }

        defs._outputs.push(
          {
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: opts.withIOSchema ? pin.schema : void 0
          }
        )
      })
    }

    if (frame.outputPins) {
      frame.outputPins.forEach(pin => {
        if (!frame.parent) {//root
          outputsReg.push({
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: opts.withIOSchema ? pin.schema : void 0,
          })
        }

        if (pin.type === 'event' || pin.type === 'shortcut') {
          let idPre = '_rootFrame_'//_rootFrame_
          scanOutputPin(pin, idPre)
        }

        defs.outputs.push(
          {
            id: pin.hostId,
            title: pin.title,
            type: pin.type,
            schema: opts.withIOSchema ? pin.schema : void 0
          }
        )
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
        // if (com.title === '按钮1' && com.id === 'u_zJFoV') {
        //   console.log(com.id)
        //   debugger
        // }

        if (!com || !com.runtime) {//可能存在组件已损坏的情况
          return
        }

        if (com.diagramModel) {//校验对应diagram是否已被删除的情况
          const diagram = com.diagramModel
          const frameModel = diagram.parent
          if (frameModel && frameModel.diagramAry && !frameModel.diagramAry.find(dia => dia.id === diagram.id)) {//对应diagram已被删除
//console.log(com.runtime.title, '对应diagram已被删除')
            return
          }
        }

        const rt = com.runtime

        if (rt.id === 'u_C6zfO') {
          debugger
        }

        // if (rt.id === 'u_6CUxt') {
        //   debugger
        // }

        const def = rt.def

        if (def.namespace === COM_NS_SELECTION) {//忽略选区组件
          return
        }

        if (def.namespace === COM_NS_MODULE) {//模块
          const moduleId = com.ioProxyForCall?.frame?.id
          if (moduleId) {
            if (!depsReg.find(now => now.namespace === def.namespace && now.version === def.version && now.moduleId === moduleId)) {
              depsReg.push({...def, moduleId})
            }
          }
        } else if (!depsReg.find(now => now.namespace === def.namespace && now.version === def.version)) {
          depsReg.push(def)
        }

        const configPinIdAry = []
        const _inputPinIdAry = []
        const inputPinIdAry = []
        const outPinIdAry = []

        const geo = rt.geo

        // if(com.runtime.title==='自定义容器12'){
        //   debugger
        // }

        // if(com.runtime.title==='图片'){
        //   debugger
        // }

        let model = opts.needClone ? JSON.parse(JSON.stringify(rt.model)) : rt.model

        if (model.extSourceCodes) {
          if (opts.needClone) {
            delete model.extSourceCodes
          }

          model.isAICode = true
        }

        if (rt.modelForToJSON) {
          model = Object.assign({}, model, rt.modelForToJSON)//合并
          rt.modelForToJSON = void 0//清除
        }

        if (Array.isArray(model.outputAry)) {//简化
          model.outputAry = model.outputAry.map(item => {
            return item.hostId
          })
        }

        const style = {} as any

        if (rt.geo) {
          //debugger
          //const geoPtStyle = rt.geo.parent?.style

          // if (geoPtStyle?.layout === 'absolute' || geoPtStyle?.layout === 'smart') {
          //   delete model.style['marginTop']
          //   delete model.style['marginRight']
          //   delete model.style['marginBottom']
          //   delete model.style['marginLeft']
          // }
          //
          // if (model.style) {
          //   if (model.style.position === 'absolute') {
          //     style.position = 'absolute'
          //   }
          //
          //   style.width = model.style.widthFact
          //   style.height = model.style.heightFact
          // } else {
          //   model.style = {}//兼容
          // }


          const comStyle = model.style
          const geoPtStyle = rt.geo.parent?.style

          // if (rt.id === 'u_V3Ni3') {
          //   debugger
          // }

          if (comStyle) {
            if (geoPtStyle?.layout === 'absolute' || geoPtStyle?.layout === 'smart') {
              delete comStyle['marginTop']
              delete comStyle['marginRight']
              delete comStyle['marginBottom']
              delete comStyle['marginLeft']
            }

            if (comStyle.width === 'auto' || comStyle.width === 'fit-content') {
              comStyle.widthAuto = true
            }

            if (comStyle.height === 'auto' || comStyle.height === 'fit-content') {
              comStyle.heightAuto = true
            }

            if (comStyle.position === 'absolute') {
              style.position = 'absolute'
            }

            style.width = comStyle.widthFact
            style.height = comStyle.heightFact

          } else {
            model.style = {}//兼容
          }


          // if(rt.geo.$el){
          //   if(rt.geo.$el.offsetHeight!==model.style.heightFact){
          //     debugger
          //   }
          // }

          // style.width = rt.geo.$el ? rt.geo.$el.offsetWidth : void 0
          // style.height = rt.geo.$el ? rt.geo.$el.offsetHeight : void 0
        }

        // if (comsReg[rt.id]) {
        //   debugger
        // }

        delete model.inputAry
        delete model.outputAry

        // console.log(model.runtime?.title)
        //
        // if (rt.title === '组件的Fx卡片0') {
        //   debugger
        // }

        if (com.ioProxy && com.ioProxy._type === 0) {//fx,处理fx中配置项的默认值
          let configs
          com.ioProxy.inputPins.forEach(pin => {
            if (pin.type === 'config' && pin.extValues?.config?.defaultValue) {
              configs = configs || {}
              configs[pin.hostId] = pin.extValues.config.defaultValue
            }
          })

          if (configs) {
            model.data.configs = configs
          }
        }

        let ioProxy

        if (def.namespace === COM_NS_FX) {//fn
          //debugger

          ioProxy = {
            id: com.ioProxy?.id || com.ioProxy?.frameId,
            type: 'fx'
          }
        }

        if (rt.id === 'u_C6zfO') {
          debugger
        }

        const comReg = {
          id: rt.id,
          def,
          isTemp: rt.isTemp,
          frameId: frame.parent ? frame.id : void 0,
          parentComId: frame.parent?.runtime?.id,
          title: rt.title,
          model,
          style,
          asRoot: geo ? geo.asRoot : void 0,
          reservedEditorAry: geo ? geo.reservedEditorAry : void 0,
          //constraints: geo ? geo.constraints : void 0,
          configs: configPinIdAry,
          //timerInput: void 0,
          _inputs: _inputPinIdAry,
          inputs: inputPinIdAry,
          outputs: outPinIdAry,
          frames: void 0,
          ioProxy
        } as any

        if (rt.def.namespace===COM_NS_VAR) {
          if (com.outputPins.length > 0) {
            comReg.schema = com.outputPins[0].schema
          }
        }

        comsReg[rt.id] = comReg

        if (opts.onlyDiff
          //&& typeof opts.onlyDiff.getComDef === 'function'
        ) {
          const comDef = opts.onlyDiff.getComDef(def)
          if (comDef) {
            const oriData = comDef.data

            model.data = getJSONDiff(model.data, oriData)

            if (!def.rtType?.match(/^js/)) {//忽略js组件的inputs
              delete comsReg[rt.id].inputs
              delete comsReg[rt.id].outputs
            }

            delete comsReg[rt.id].configs
            delete comsReg[rt.id]._inputs

            //console.log(oriData, model.data, diffData)
          }
        }

        // if(com.title==='对话框'){
        //   debugger
        // }

        if (com.configPins) {
          com.configPins.forEach(pin => {
            configPinIdAry.push(pin.hostId)
          })
        }

        if (com.timerInput) {
          scanInputPin(com.timerInput, rt.id)
          comsReg[rt.id].timerInput = com.timerInput.hostId
        }

        Arrays.each(pin => {
            scanInputPin(pin, rt.id)
            _inputPinIdAry.push(pin.hostId)
          }, com._inputPins
        )

        Arrays.each(pin => {
            // if(pin.title.indexOf('新增扩展输入项')>=0){
            //   debugger
            // }
            scanInputPin(pin, rt.id)
            inputPinIdAry.push(pin.hostId)
          },
          com.inputPins,
          com.inputPinsInModel,
          com.inputPinExts,
          com.inputPinExtForFrames,
        )

        Arrays.each(pin => {
            scanOutputPin(pin, rt.id)

            // if (opts.withDiagrams) {
            //   outPinIdAry.push({
            //     hostId: pin.hostId,
            //     schema: pin.schema,
            //   })
            // } else {
            outPinIdAry.push(pin.hostId)
            //}
          },
          com.outputPins,
          com.outputPinsInModel,
          com.outputPinExts,
          com.outputPinNexts)
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
          const frames = comReg.frames = []

          com.frames.forEach(frame => {
            const def = scanFrame(frame)
            frames.push(def)
          })
        }
      })
    }

    if (frame.frameAry) {
      frame.frameAry.forEach(frame => {
        if (frame.hostFrameId) {
          return
        }

        scanFrame(frame)
      })
    }

    if (frame.diagramAry) {
      frame.diagramAry.forEach(diagram => {//在diagram中扫描变量作为autorun的情况
        const comAry = diagram.comAry || []
        comAry.forEach(com => {
          if (com.forkedFrom) {
            const rt = com.runtime
            if (rt && rt.def.namespace === COM_NS_VAR) {//
              if (com.inputPins.length <= 0) {
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
                  def: rt.def
                })
              }
            }
          }
        })
      })
    }

    return defs
  }

  if (frame) {
    scanFrame(frame)
  }

  let frameType
  if (frame.type === 'extension') {
    if (frame.extType) {
      frameType = `extension-${frame.extType}`
    } else {
      frameType = `extension`
    }
  } else {
    frameType = frame.type
  }

// console.log('consReg::::',consReg)
//
//   if (frame.title === 'API') {
//     debugger
//   }

  return {
    '-v': pkg.version,
    id: frame.id,
    name: frame.name,
    title: frame.title,
    type: frameType,
    deps: depsReg,
    coms: comsReg,
    comsAutoRun,
    _inputs: _inputsReg,
    _outputs: _outputsReg,
    inputs: inputsReg,
    outputs: outputsReg,
    cons: consReg,
    pinRels: pinRelsReg,
    pinProxies: pinProxyReg,
    pinValueProxies: pinValueProxyReg,
  }
}

function getFrameKey(frame) {
  if (frame) {//frame 可能不存在（对应的diagramModelparent为空)
    if (frame.parent) {
      if (frame.parent._type === 1) {
        return `${frame.parent.runtime.id}-${frame.id}`
      } else {
        return `${frame.id}`
      }
    } else {
      return `_rootFrame_`
    }
  }
}