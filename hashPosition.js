function hashPosition(box, params = {}) {
  box.style.position = "relative"
  if (typeof params === "number") {
    params = {
      minWidth: params,
      maxWidth: params,
    }
  } else if (params.width) {
    params.minWidth = params.minWidth || params.width
    params.maxWidth = params.maxWidth || params.width
  }
  let { minWidth, maxWidth, space } = params
  const zeroSpace = minWidth === maxWidth
  space = space || maxWidth * 0.2
  maxWidth = zeroSpace ? maxWidth + space : maxWidth
  let boxWidth = box.scrollWidth
  let boxHeight = box.scrollHeight
  // 获取圆心
  let centerX = boxWidth / 2
  let centerY = boxHeight / 2
  // 在box区域获取可用区域
  let maxBoxWidth = boxWidth > boxHeight ? boxWidth : boxHeight
  let minBoxWidth = boxWidth < boxHeight ? boxWidth : boxHeight
  // 设置圆环数量
  let sumI = Math.round(maxBoxWidth / 2 / maxWidth) - 1
  // 环初始数据 保存可用弧度
  // 环占用数据 一个环的数据[[a,b],[a,b]] a位占用弧度位置 b为弧度宽度 根据a排序push
  let ringData = []
  let ringInitData = []
  for (let i = 0; i < sumI; i++) {
    let radius = (i + 1) * maxWidth
    let b = minBoxWidth / 2
    if (b >= radius) {
      let c = Math.PI / 2
      ringInitData[i] = [
        [-c, c],
        [-c + Math.PI, c + Math.PI],
      ]
    } else {
      let a = Math.atan(b / Math.sqrt(radius * radius - b * b))
      ringInitData[i] = [
        [-a, a],
        [-a + Math.PI, a + Math.PI],
      ]
    }
    ringData[i] = []
  }
  // 寻找可用范围 maxData环整体范围 useData环已使用范围(已排序) needWidth需求宽度
  let findAvailableData = (maxData, useData = [], needWidth) => {
    if (useData.length === 0) {
      return maxData
    }
    let result = []
    let maxDataA = maxData[0]
    let maxDataB = maxData[1]
    for (let i = 0; i < useData.length; i++) {
      let start = useData[i][0] - useData[i][1] / 2
      let end = useData[i][0] + useData[i][1] / 2
      // 0时前后都要比较
      if (i === 0) {
        if (maxDataA[1] > useData[i][0]) {
          // 表明最大区间前区间已用
          if (Math.abs(maxDataA[0] - start) >= needWidth) {
            result.push([maxDataA[0], start])
          }
        } else {
          // 表明最大区间前区间未用
          result.push(maxDataA)
          // 那肯定时在后区间了
          if (Math.abs(maxDataB[0] - start) >= needWidth) {
            result.push([maxDataB[0], start])
          }
        }
      }
      // 非零只向后比较
      // 拿到后比较值
      if (i < useData.length - 1) {
        // 非最后一个块时拿后一个块的开始
        // 判断后一个块是否和当前在同一区间
        let spaceWidth
        let needEnd
        if (
          (useData[i][0] < maxDataA[1] && useData[i + 1][0] < maxDataA[1]) ||
          (useData[i][0] > maxDataB[0] && useData[i + 1][0] > maxDataB[0])
        ) {
          // 两个块在同一区间
          spaceWidth = useData[i + 1][0] - useData[i + 1][1] / 2 - end
          needEnd = useData[i + 1][0] - useData[i + 1][1] / 2
        } else {
          spaceWidth = maxDataA[1] - end
          needEnd = maxDataA[1]
        }
        if (spaceWidth >= needWidth) {
          result.push([end, needEnd])
        }
      } else {
        let comEnd
        // 最后一个块拿区间的最后
        if (start > maxDataB[0]) {
          // 最后一个在最大区间后区间
          comEnd = maxDataB[1]
        } else {
          comEnd = maxDataA[1]
          result.push(maxDataB)
        }
        if (comEnd - end >= needWidth) {
          result.push([end, comEnd])
        }
      }
    }
    return result
  }
  let pushUsePoint = (index, location, width) => {
    let ringUserData = ringData[index]
    let status = false
    let bak = [location, width]
    for (let i = 0; i < ringUserData.length; i++) {
      let [a] = ringUserData[i]
      if (a > location && !status) {
        status = true
      }
      if (status) {
        let bak1 = ringUserData[i]
        ringUserData[i] = bak
        bak = bak1
      }
    }
    ringUserData.push(bak)
    return location
  }
  // 在换上寻找位置 找到返回角度，无返回null
  let findLocation = (index, width) => {
    let radius = (index + 1) * maxWidth
    // 当前需求的角度
    let needRadius = Math.atan(width / radius) * 2
    let ringUserData = ringData[index]
    let canNeedData = findAvailableData(
      ringInitData[index],
      ringUserData,
      needRadius
    )
    if (canNeedData.length === 0) {
      // 未找到可用位置
      return null
    }
    let a3 = parseInt(Math.random() * canNeedData.length)
    let [start, end] = canNeedData[a3]
    start += needRadius / 2
    end -= needRadius / 2
    return pushUsePoint(
      index,
      start + Math.random() * (end - start),
      needRadius
    )
  }
  let getXY = () => {
    const a = maxWidth - minWidth
    // 随机到某个环上
    let index
    // 随机宽度
    let count = 0
    const itemWidthSet = () => {
      return minWidth + Math.random() * a
    }
    let itemWidth = itemWidthSet()
    // 去环上找空位
    let userIndex = []
    // 拿到放置角度
    let resultRadius = null
    for (; resultRadius === null; ) {
      if (userIndex.length >= sumI) {
        count++
        if (count > 5) {
          return null
        }
        itemWidth = itemWidthSet()
        userIndex = []
      }
      index = parseInt(Math.random() * sumI)
      if (userIndex.includes(index)) {
        continue
      }
      userIndex.push(index)
      resultRadius = findLocation(index, itemWidth)
    }
    let ab = a / 2 - 5
    ab = ab < 0 ? 0 : ab
    let randomWidth = (index + 1) * maxWidth - ab + Math.random() * 2 * ab
    let x = randomWidth * Math.cos(resultRadius)
    let y = randomWidth * Math.sin(resultRadius)
    return [centerX + x, centerY + y, itemWidth]
  }
  let id = 0
  const children = box.getElementsByClassName("hash-item")
  for (let child of children) {
    let result = getXY()
    if (result) {
      let [x, y, width] = result
      width = zeroSpace ? minWidth : width
      child.style.position = "absolute"
      child.style.left = x + "px"
      child.style.top = y + "px"
      if (!zeroSpace) {
        child.style.width = width + "px"
        child.style.height = width + "px"
      }
    } else {
      child.style.display = "none"
      console.log("未找到位置")
    }
  }
}
