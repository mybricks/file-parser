export function getJSONDiff(curJSON, oriJSON) {
  if(!oriJSON){
    return curJSON
  }
  
  let result
  
  for (let key in curJSON) {
    const curValue = curJSON[key]
    const oriValue = oriJSON[key]
    
    const diff = getDiffVal(curValue, oriValue)
    if (diff !== undefined) {
      if (!result) {
        result = {}
      }
      result[key] = diff
    }
  }
  
  return result
}

function getDiffVal(curValue, oriValue) {
  if (Array.isArray(curValue)) {
    if (!Array.isArray(oriValue)) {
      return curValue
    }
    
    if (curValue.length !== oriValue.length) {
      return curValue
    }
    
    if (curValue.find((item, i) => {
      const diff = getDiffVal(item, oriValue[i])
      
      if (diff !== undefined) {
        return true
      }
    })) {
      return curValue
    }
    
    return
  } else if (typeof curValue === 'object') {
    return getJSONDiff(curValue, oriValue)
  } else if (curValue !== oriValue) {//Primitive
    return curValue
  }
  
  return
}