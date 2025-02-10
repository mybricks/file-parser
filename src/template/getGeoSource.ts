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
        }

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