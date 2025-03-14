import {getComDataJSON} from './getComDataJSON'

export function getSlotPrompts(slotModel) {
  const scanSlot = (slot) => {
    if (slot.comAry) {
      const comAry = []
      slot.comAry.forEach((com) => {
        const rt = com.runtime
        const def = rt.def

        const model = rt.model

        let slots
        if (com.slots) {
          slots = {}

          com.slots.forEach(slot => {
            slots[slot.id] = scanSlot(slot)
          })
        }

        const comJSON = {
          id: rt.id,
          name: com.name,
          title: rt.title,
          namespace: def.namespace,
          version: def.version,
          style: model.style,
          data: model.data,
          slots
        } as any

        // if (rt.topl) {
        //   const inputs = getAllInputs(rt.topl)
        //   if (inputs) {
        //     comJSON.inputs = inputs
        //   }
        //
        //   const outputs = getAllOutputs(rt.topl)
        //   if (outputs) {
        //     comJSON.outputs = outputs
        //   }
        // }

        // if (def.namespace.indexOf('form') >= 0) {
        //   debugger
        // }

        comJSON.data = getComDataJSON(def.namespace, {data: model.data})

        comAry.push(comJSON)
      })

      const widthFact = slot.style.widthFact
      const heightFact = slot.style.heightFact

      const style = Object.assign({},
        slot.style, {
          width: widthFact,
          height: heightFact
        })

      const rtn = {
        id: slot.id,
        title: slot.title,
        type: slot.type,
        showType: slot.showType,
        comAry,
        style
      } as any

      if (slot.type === 'scope') {
        if (slot.parent.runtime) {
          const geoParent = slot.parent

          const topl = geoParent.runtime.topl
          if (topl) {
            const frame = topl.frames.find(frame => frame.id === slot.id)
            if (frame) {
              const interactions = {} as any

              if (frame.inputPins) {
                const inputs = []
                frame.inputPins.forEach(pin => {
                  inputs.push({
                    id: pin.id,
                    hostId: pin.hostId,
                    title: pin.title,
                    direction: pin.direction,
                    schema: pin.schema
                  })
                })

                interactions.inputs = inputs
              }

              if (frame.outputPins) {
                const outputs = []
                frame.outputPins.forEach(pin => {
                  outputs.push({
                    id: pin.id,
                    hostId: pin.hostId,
                    title: pin.title,
                    direction: pin.direction,
                    schema: pin.schema
                  })
                })

                interactions.outputs = outputs
              }

              rtn.interactions = interactions
            }
          }
        }
      }

      return rtn
    }
  }

  let ui: {
    id,
    title,
    type,
    comAry,
    style
  }

  if (slotModel) {
    ui = scanSlot(slotModel)
  }

  return ui
}

function getAllInputs(com) {
  const inputs = []
  if (com.inputPins) {
    com.inputPins.forEach(pin => {
      const realPin = pin.forkedFrom || pin
      inputs.push({
        id: realPin.hostId,
        title: pin.title,
        schema: pin.schema
      })
    })
  }

  if (com.inputPinsInModel) {
    com.inputPinsInModel.forEach(pin => {
      const realPin = pin.forkedFrom || pin
      inputs.push({
        id: realPin.hostId,
        title: pin.title,
        schema: pin.schema
      })
    })
  }

  if (com.inputPinExts) {
    com.inputPinExts.forEach(pin => {
      inputs.push({
        id: pin.hostId,
        title: pin.title,
        schema: pin.schema
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
        id: realPin.hostId,
        title: pin.title,
        schema: pin.schema
      })
    })
  }

  if (com.outputPinsInModel) {
    com.outputPinsInModel.forEach(pin => {
      const realPin = pin.forkedFrom || pin
      outputs.push({
        id: realPin.hostId,
        title: pin.title,
        schema: pin.schema
      })
    })
  }

  if (com.outputPinExts) {
    com.outputPinExts.forEach(pin => {
      outputs.push({
        id: pin.hostId,
        title: pin.title,
        schema: pin.schema
      })
    })
  }

  return outputs
}