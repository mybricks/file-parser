//临时处理各类组件的数据
export function getComDataJSON(namespace, {data}) {
  if (namespace === 'mybricks.normal-pc.form-container') {
    const json = {}
    for (const key in data) {
      if (key === 'items') {
        json[key] = []
      } else {
        json[key] = data[key]
      }
    }

    return json
  }

  return data
}