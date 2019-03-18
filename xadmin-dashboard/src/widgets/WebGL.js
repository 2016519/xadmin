import React from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import Icon from 'react-fontawesome'
import { app, StoreWrap } from 'xadmin'
import elementResizeEvent from 'element-resize-event'

class WebGL extends React.Component {

  init = false
  initing = false

  // first add
  componentDidMount() {
    let onEvents = this.props.onEvents || {}
    this.renderGLDom(glObj => glObj.resize())

    //this.bindEvents(glObj, onEvents)

    // on resize
    elementResizeEvent(this.refs.webglDom, () => {
      this.renderGLDom(glObj => glObj.resize())
    })
  }

  // update
  componentDidUpdate() {
    this.renderGLDom(glObj => glObj.resize())
  }

  // remove
  componentWillUnmount() {
    
  }

  //bind the events
  bindEvents(instance, events) {
    let _loop =  (eventName) => {
      // ignore the event config which not satisfy
      if (typeof eventName === 'string' && typeof events[eventName] === 'function') {
        // binding event
        instance.off(eventName)
        instance.on(eventName, (param) => {
          events[eventName](param, instance)
        })
      }
    }

    for (let eventName in events) {
      _loop(eventName)
    }

  }

  // render the dom
  renderGLDom(cb) {
    if(this.initing) return
    this.getGLInstance(glObj => {
      glObj.setOption(this.props)
      cb(glObj)
    })
  }

  getGLInstance(cb) {
    if(this.init) {
      cb(this.props.modal)
    } else {
      this.initing = true
      this.props.modal.init(this.refs.webglDom, () => {
        cb(this.props.modal)
        this.init = true
        this.initing = false
      })
    }
  }

  render() {
    const style = {
      height: '100%', ...this.props.style
    }
    return <div style={style} ref="webglDom" />
  }

}

export default WebGL
