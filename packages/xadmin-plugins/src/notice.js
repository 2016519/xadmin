import React from 'react'
import { StoreWrap } from 'xadmin'
import { AlertList } from 'react-bs-notifier'

const Notices = StoreWrap('xadmin.notice')(({ notices, onDismiss }) => {
  return <AlertList key="notice" alerts={notices} position="top-left" timeout={2000} onDismiss={onDismiss} dismissTitle="Dismiss" />
})

export default {
  name: 'xadmin.notice',
  blocks: {
    'main': () => <Notices />
  },
  mappers: {
    'xadmin.notice': {
      data: ({ state }) => {
        return {
          notices: state.notices
        }
      },
      method: {
        onDismiss: ({ dispatch }) => (notice) => {
          dispatch({ type: '@@xadmin/DISMISS_NOTICE', payload: notice })
        }
      }
    }
  },
  reducers: {
    notices: (state=[], { type, payload, ...props }) =>{
      if(type == '@@xadmin/ADD_NOTICE') {
        return [ ...state, { ...props, ...payload, id: (new Date()).getTime() } ]
      } else if(type == '@@xadmin/DISMISS_NOTICE') {
        const idx = state.indexOf(payload)
        if (idx >= 0) {
          return [ ...state.slice(0, idx), ...state.slice(idx + 1) ]
        }
      }
      return state
    }
  }
}
