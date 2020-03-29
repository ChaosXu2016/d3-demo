const lineChart = (function() {
  let options = {
    xKey: 'x',
    yKey: 'y',
    padding: 50,
    width: 500,
    height: 309,
    duration: 2000
  }

  let scaleX = null

  let scaleY = null

  let svg = null

  let lastData = null

  let isFirst = true

  let line = null

  let area = null

  function mergeOptions(opts) {
    return Object.assign(options, opts)
  }

  function cloneData(data) {
    return data.map(item => ({ ...item }))
  }

  // 添加可交互的点
  function dotDecorator(data) {
      // add dot
      const dotGroup = svg.append('g')
      .attr('transform', `translate(${options.padding}, ${options.padding})`)

      dotGroup.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => scaleX(d[options.xKey]))
      .attr('class', 'data-dot-item')
      .attr('r', 3)
      .attr('idx', (d, index) => index)
      .transition()
      .duration(options.duration)
      .attrTween('cy', d => d3.interpolate(scaleY(0), scaleY(d[options.yKey])))
      
      isFirst && bindEvent(data)
      return dotGroup
  }

  function bindEvent() {
    isFirst = false
    let dragTarget = null
    // add event
    d3.selectAll('.data-dot-item')
    .on('mouseover', function() {
      d3.select(this)
      .classed('cursor-pointer', true)
      .transition()
      .duration(200)
      .attrTween('r', d => d3.interpolate(3, 6))
    })
    .on('mouseout', function() {
      d3.select(this)
      .classed('cursor-pointer', false)
      .transition()
      .duration(200)
      .attrTween('r', d => d3.interpolate(6, 3))
    })
    .on('mousedown', function() {
      dragTarget = this
    })

    svg
    .on('mouseup', function() {
      dragTarget = null
    })
    .on('mousemove', function() {
      if(!dragTarget) return
      const newY = Math.max(scaleY.invert(d3.event.clientY - 50), 0)
      const idx = d3.select(dragTarget).attr('idx')
      lastData[idx][options.yKey] = newY
      d3.selectAll('.data-line')
      .attr('d', line(lastData))
      d3.selectAll('.data-area')
      .attr('d', area(lastData))
      d3.select(dragTarget)
      .attr('cy', d3.event.clientY - 50)
    })
  }

  /**
   * width, height, root, padding, rangeX, rangeY, duration
   */
  const lineChart = function(opts) {
    options = mergeOptions(opts)

    const svgWidth = options.padding * 2 + options.width
    const svgHeight = options.padding * 2 + options.height

    // create svg
    svg = d3.create('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)

    // scaleX
    scaleX =  d3.scaleLinear()
    .domain(options.rangeX)
    .range([0, options.width])

    // scaleY
    scaleY = d3.scaleLinear()
    .domain(options.rangeY)
    .range([ 0, options.height ])

    // x-axis
    let axisX = d3.axisBottom(scaleX)
    
    // hasFormat?
    options.ticksXFormat && (axisX = axisX.tickFormat(options.ticksXFormat))

    var axisY = d3.axisLeft(scaleY).tickSize(options.width)

    // append x-axis
    svg.append("g")
    .call(axisX)
    .attr('class', 'x-axis')
    .attr('transform', `translate(${options.padding}, ${options.height + options.padding})`)

    // append y-axis
    svg.append("g")
    .call(axisY)
    .attr('class', 'y-axis')
    .attr('transform', `translate(${options.width + options.padding}, ${options.padding})`)

    // insert chart to the root
    options.root.appendChild(svg.node())

    return renderGraph
  }

  const tweenFn = (shape, data) => () => {
    var interpolator = d3.interpolate(lastData, data)
    return function(t){
      return shape(interpolator(t))
    }
  }

  function renderGraph(data) {
    !lastData && (lastData = data.map(item => {
      const cItem = { ...item }
      cItem[options.yKey] = 0
      return cItem
    }))
    line = d3.line()
    .defined(d => !isNaN(d[options.yKey]))
    .x(d => scaleX(d[options.xKey]))
    .y(d => scaleY(d[options.yKey]))

    area = d3.area()
    .defined(d => !isNaN(d[options.yKey]))
    .x(d => scaleX(d[options.xKey]))
    .y1(d => scaleY(d[options.yKey]))
    .y0(d => scaleY(0))
    
    const lineGroup = svg.append('g')
    .attr('transform', `translate(${options.padding}, ${options.padding})`)

    lineGroup.append('path')
    .attr('class', 'data-line')
    .datum(data)
    .transition()
    .duration(options.duration)
    .attrTween('d', tweenFn(line, data))

    lineGroup.append('path')
    .attr('class', 'data-area')
    .datum(data)
    .transition()
    .duration(options.duration)
    .attrTween('d', tweenFn(area, data))
    .on('end', () => {
      lastData = cloneData(data)
    })

    dotDecorator(data)

    d3.transition()
    return svg
  }
  return lineChart
})()