export function searchBindWithByToplKey(configBindWith, toplKey) {
  if (Array.isArray(configBindWith)) {
    const bindItem = configBindWith.find(item => {
      const nowToplKey = item.toplKey
      if (nowToplKey === toplKey) {
        return item
      } else if (typeof nowToplKey === 'object') {
        if (nowToplKey.in === toplKey || nowToplKey.out === toplKey) {
          return item
        }
      }
    })

    return bindItem
  }
}