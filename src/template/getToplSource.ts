import {COM_NS_FX, COM_NS_SCENE, COM_NS_VAR} from "../constants";

export function getToplSource(frame) {
  const result = {
    scenes: []
  }

  if (frame.frames) {
    frame.frames.forEach(frame => {
      const frameJSON = proFrame(frame)
      if (frameJSON) {
        result.scenes.push(frameJSON)
      }
    })
  }

  return result
}

function proFrame(frame) {
  const inputs = [],
    outputs = [],
    frames = [],
    diagrams = [],
    comAry = []

  let type

  if (frame.parent?._type === 0) {
    if (frame.isTypeOfFx()) {
      type = 'fx'
    } else {
      type = 'frame'
    }
  } else if (frame.parent?.runtime) {
    type = 'com'
  } else {
    type = 'scene'
  }

  if (frame.inputPins) {
    frame.inputPins.forEach(pin => {
      //if (!frame.parent) {//root
      inputs.push({
        id: pin.id,
        hostId: pin.hostId,
        title: pin.title,
        type: pin.type,
        schema: pin.schema,
        extValues: pin.extValues
      })
      //}

      //scanOutputPin(pin as PinModel, idPre)
    })
  }

  if (frame.outputPins) {
    frame.outputPins.forEach(pin => {
      //if (!frame.parent) {//root
      outputs.push({
        id: pin.id,
        hostId: pin.hostId,
        title: pin.title,
        type: pin.type,
        schema: pin.schema
      })
      //}
    })
  }

  if (frame.frameAry) {
    frame.frameAry.forEach(frame => {
      if (frame.diagramAry.length > 0) {
        const frameJSON = proFrame(frame)
        frames.push(frameJSON)
      }
    })
  }

  if (frame.diagramAry) {
    frame.diagramAry.forEach(diagram => {
      const json = proDiagram(diagram)
      if (json) {
        diagrams.push(json)
      }
    })
  }

  if (frame.comAry) {
    frame.comAry.forEach(com => {
      const json = proCom(com)
      if (json) {
        comAry.push(json)
      }
    })
  }

  if (diagrams.length <= 0 && frames.length <= 0 && comAry.length <= 0) {
    return
  }

  const frameJSON = {
    id: frame.id,
    title: frame.diagramAry[0].title,
    type
  } as any

  if (comAry.length > 0) {
    frameJSON.comAry = comAry
  }

  if (diagrams.length > 0) {
    frameJSON.diagrams = diagrams
  }

  if (frame.comAry) {
    if (comAry.length > 0) {
      frameJSON.comAry = comAry
    }
  }

  if (frames.length > 0) {
    frameJSON.frames = frames
  }

  if (inputs.length > 0) {
    frameJSON.inputs = inputs
  }

  if (outputs.length > 0) {
    frameJSON.outputs = outputs
  }

  return frameJSON
}

function proCom(com) {
  if (com.frames) {
    const frames = []
    com.frames.forEach(frame => {
      const frameJSON = proFrame(frame)
      if (frameJSON) {
        frames.push(frameJSON)
      }
    })

    if (frames.length > 0) {
      const comJSON = {
        id: com.id,
        title: com.runtime.title,
        frameAry: frames
      }

      return comJSON
    }
  }
}

function proDiagram(diagram) {
  if (diagram.conAry.length <= 0) {
    return
  }

  const comAry = []
  const connections = []

  const diagramJson = {
    id: diagram.id,
    title: diagram.title,
    comAry,
    connections
  } as any

  if (diagram.isGlobal||!diagram.parent.parent) {
    diagramJson.type = 'scene'
  }

  if (diagram.startWithCom) {
    let startWithCom = diagram.startWithCom
    startWithCom = startWithCom.forkedFrom || startWithCom

    const startWithComRt = startWithCom.runtime
    const outputPin = diagram.startWithCom.outputPins[0]
    const realOutputPin = outputPin.forkedFrom || outputPin

    diagramJson.type = 'event'
    diagramJson.from = {
      com: {
        id: startWithComRt.id,
        title: startWithComRt.title,
        pinId: realOutputPin.hostId
      }
    }
  }

  if (diagram.comAry.length > 0) {
    diagram.comAry.forEach(com => {
      const realCom = com.forkedFrom || com
      const comRt = realCom.runtime

      let type
      if (comRt.geo) {//has ui
        type = 'ui'
      } else if (comRt.def.namespace === COM_NS_SCENE) {
        type = 'scene'
      } else if (comRt.def.namespace === COM_NS_VAR) {
        type = 'var'
      } else if (comRt.def.namespace === COM_NS_FX) {
        type = 'fx'
      } else {
        type = 'js'
      }
// if(com.runtime.title.indexOf('表格')>=0){
//   debugger
// }

      const inputs = getAllInputs(com)

      const outputs = getAllOutputs(com)

      // if(!com.id){
      //   debugger
      // }

      const comJSON = {
        id: comRt.id,
        title: comRt.title,
        namespace: comRt.def.namespace,
        type,
        style: com.style,
        inputs,
        outputs
      } as any

      if (!comRt.geo) {
        comJSON.data = comRt.model.data
      }

      comAry.push(comJSON)
    })
  }

  diagram.conAry.forEach(con => {
    const startPin = con.startPin
    const realStartPin = startPin.forkedFrom || startPin

    const finishPin = con.finishPin
    const realFinishPin = finishPin.forkedFrom || finishPin

    const startParent = startPin.parent
    const realStartParent = startParent.forkedFrom || startParent
    const startParentRt = realStartParent.runtime

    const finishParent = finishPin.parent
    const realFinishParent = finishParent.forkedFrom || finishParent
    const finishParentRt = realFinishParent.runtime

    // if(!startPin.hostId||!finishPin.hostId){
    //   debugger
    // }

    const connection = {
      from: {
        pin: {
          id: realStartPin.id,
          hostId: realStartPin.hostId,
          title: realStartPin.title,
          position: con.startPo
        }
      },
      to: {
        pin: {
          id: realFinishPin.id,
          hostId: realFinishPin.hostId,
          title: realFinishPin.title,
          position: con.finishPo
        }
      }
    } as any

    if (startParentRt) {
      connection.from.com = {
        id: startParentRt.id,
        title: startParentRt.title
      }
    } else if (startPin.parent._type === 0) {//frame
      connection.from.frame = {
        id: startPin.parent.id,
        title: startPin.parent.title,
        pinSchema: startPin.schema
      }
    }

    if (finishParentRt) {
      connection.to.com = {
        id: finishParentRt.id,
        title: finishParentRt.title
      }
    } else if (finishPin.parent._type === 0) {//frame
      connection.from.frame = {
        id: finishPin.parent.id,
        title: finishPin.parent.title,
        pinSchema: finishPin.schema
      }
    }

    connections.push(connection)
  })

  return diagramJson
}

function getAllInputs(com) {
  const inputs = []
  if (com.inputPins) {
    com.inputPins.forEach(pin => {
      const realPin = pin.forkedFrom || pin
      inputs.push({
        id: realPin.hostId,
        hostId: realPin.hostId,
        title: pin.title
      })
    })
  }

  if (com.inputPinsInModel) {
    com.inputPinsInModel.forEach(pin => {
      const realPin = pin.forkedFrom || pin
      inputs.push({
        id: realPin.id,
        hostId: realPin.hostId,
        title: pin.title
      })
    })
  }

  if (com.inputPinExts) {
    com.inputPinExts.forEach(pin => {
      inputs.push({
        id: pin.id,
        hostId: pin.hostId,
        title: pin.title
      })
    })
  }

  return inputs
}

function getAllOutputs(com) {
  const outputs = []
  if (com.outputPins) {
    com.outputPins.forEach(pin => {
      const realPin = pin.forkedFrom || pin
      outputs.push({
        id: realPin.id,
        hostId: realPin.hostId,
        title: pin.title
      })
    })
  }

  if (com.outputPinsInModel) {
    com.outputPinsInModel.forEach(pin => {
      const realPin = pin.forkedFrom || pin
      outputs.push({
        id: realPin.id,
        hostId: realPin.hostId,
        title: pin.title
      })
    })
  }

  if (com.outputPinExts) {
    com.outputPinExts.forEach(pin => {
      outputs.push({
        id: pin.id,
        hostId: pin.hostId,
        title: pin.title
      })
    })
  }

  return outputs
}