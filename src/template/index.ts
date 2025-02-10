import {getSlotPrompts} from "./getGeoSource";
import {getToplSource} from "./getToplSource";

export function getPageTemplateJSON(page: {
  slot,
  frame
}) {
  if (page) {
    const {slot, frame} = page

    const rtn = {} as any

    const slotAry = slot.slots.map(slot => {
      return getSlotPrompts(slot)
    })

    rtn.ui = slotAry

    const toplSource = getToplSource(frame)
    rtn.interactions = toplSource

    return rtn
  }
}