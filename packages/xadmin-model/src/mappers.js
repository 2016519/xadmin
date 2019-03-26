import React from 'react'
import _ from 'lodash'
import { app, config } from 'xadmin'
import { SubmissionError } from 'xadmin-form'
import { getFieldProp } from './utils'

export default {
  'model.item': {
    data: ({ modelState, model, state }, { id, item }) => {
      return {
        loading: state.loading && state.loading[`${model.key}.get`],
        item: item || (id ? modelState.items[id] : undefined)
      }
    },
    compute: ({ model }, { id, query, item }) => {
      const { _t } = app.context
      let data = item
      if(!data) {
        if(model.defaultValue) {
          data = _.isFunction(model.defaultValue) ? model.defaultValue() : model.defaultValue
        }
        if(!_.isEmpty(query)) {
          data = { ...data, ...query }
        }
      }

      return {
        title: id ? _t('Edit {{title}}', { title: model.title }) : _t('Create {{title}}', { title: model.title }),
        data
      }
    },
    method: {
      getItem: ({ dispatch, model }) => (id) => {
        if(id) {
          dispatch({ model, type: 'GET_ITEM', id })
        }
      },
      saveItem: ({ dispatch, model }, { successMessage }) => (item, partial, ...args) => {
        return new Promise((resolve, reject) => {
          dispatch({ model, type: 'SAVE_ITEM', item, partial, promise: { resolve, reject }, message: successMessage })
        }).catch(err => {
          throw new SubmissionError(err.formError || err.json)
        })
      }
    },
    event: {
      mount: ({ dispatch, model }, { id, data }) => {
        if(model.forceGetItem || (data == undefined && id !== undefined)) {
          dispatch({ model, type: 'GET_ITEM', id })
        }
      },
      receiveProps: ({ dispatch, model }, { id, data }, nextProps) => {
        if(id != nextProps.id && nextProps.data == undefined) {
          dispatch({ model, type: 'GET_ITEM', id: nextProps.id })
        }
      }
    }
  },
  'model.items': {
    data: ({ modelState, model, state }, props, prev) => {
      const { ids } = modelState
      return {
        ids,
        fields: modelState.filter.fields,
        loading: state.loading && state.loading[`${model.key}.items`]
      }
    },
    compute: ({ modelState, model }, props, prev) => {
      const { items, ids } = modelState
      return {
        items: ids === prev['ids'] ? prev['items'] : ids.map(id => items[id]).filter(item => !_.isNil(item))
      }
    },
    event: {
      mount: ({ dispatch, modelState, model }, { query }) => {
        let wheres
        if(query && Object.keys(query).length > 0) {
          wheres = { ...modelState.wheres, param_filter: query }
        } else {
          wheres = _.omit(modelState.wheres, 'param_filter')
        }
        if(!_.isEqual(wheres, modelState.wheres)) {
          dispatch({ model, type: 'GET_ITEMS', items: [], filter: { ...modelState.filter, skip: 0 }, success: true })
        }
        dispatch({ model, type: 'GET_ITEMS', filter: { ...modelState.filter }, wheres })
      }
    }
  },
  'model.checkall': {
    data: ({ modelState, model, state }, props, prev) => {
      const { selected, items } = modelState
      return { selected, items }
    },
    compute: ({ modelState, model }, props, prev) => {
      const { selected, ids } = modelState
      const selects = selected.map(item => item.id)
      return {
        selecteall: _.every(ids, id => selects.indexOf(id) >= 0)
      }
    },
    method: {
      changeAllSelect: ({ dispatch, modelState, model }) => (selected) => {
        if(selected) {
          const items = modelState.items
          dispatch({ model, type: 'SELECT_ITEMS', items: modelState.ids.map(id=>items[id]), selected })
        } else {
          dispatch({ model, type: 'SELECT_CLEAR' })
        }
      }
    }
  },
  'model.list.pagination': {
    data: ({ modelState }) => {
      const count = modelState.count
      const { limit, skip } = modelState.filter
      
      return {
        items: Math.ceil(count / limit),
        activePage: Math.floor(skip / limit) + 1
      }
    },
    method: {
      changePage: ({ dispatch, modelState, model }) => (page) => {
        const pageSize = modelState.filter.limit
          , skip = pageSize * (page - 1)
        dispatch({ model, type: 'GET_ITEMS', filter: { ...modelState.filter, skip: skip } })
      }
    }
  },
  'model.list.header': {
    data: ({ modelState, model }, { field }) => {
      const orders = modelState.filter.order
        , property = getFieldProp(model, field) || {}
        , canOrder = (property.canOrder !== undefined ? property.canOrder : 
          ( property.orderField !== undefined || (property.type != 'object' && property.type != 'array')))
      return {
        canOrder,
        title: property.header || property.title || _.startCase(field),
        order: orders !== undefined ? (orders[property.orderField || field] || '') : ''
      }
    },
    method: {
      changeOrder: ({ dispatch, model, modelState }, { field }) => (order) => {
        const filter = modelState.filter
        const orders = filter.order || {}
        const property = getFieldProp(model, field) || {}
        orders[property.orderField || field] = order

        dispatch({ model, type: 'GET_ITEMS', filter: { ...filter, order: orders } })
      }
    }
  },
  'model.list.row': {
    data: ({ modelState, model }, { id }) => {
      let selected = false
      for (let i of modelState.selected) {
        if (i.id === id) {
          selected = true
          break
        }
      }
      return { 
        selected,
        item: modelState.items[id]
      }
    },
    compute: ({ model }, { item }) => {
      return {
        actions: model.itemActions,
        component: model.itemComponent,
        canEdit: !!model.permission && !!model.permission.edit && item && item._canEdit !== false,
        canDelete: !!model.permission && !!model.permission.delete && item && item._canDelete !== false
      }
    },
    method: {
      changeSelect: ({ dispatch, model, modelState }, { id }) => (selected) => {
        const item = modelState.items[id]
        dispatch({ model, type: 'SELECT_ITEMS', item, selected })
      },
      editItem: ({ model, modelState }, { id }) => () => {
        app.context.router.push(`/app/model/${model.name}/${encodeURIComponent(id)}/edit`)
      },
      deleteItem: ({ dispatch, model, modelState }, { id }) => () => {
        const item = modelState.items[id]
        dispatch({ model, type: 'DELETE_ITEM', item })
      }
    }
  },
  'model.list.item': {
    compute: ({ model }, { items, field, schema }) => {
      const property = schema || getFieldProp(model, field)
      const data = schema ? {} : { schema: property }
      const key = schema ? `${schema.name}.${field}` : field
      if(model.fieldRender == undefined) {
        model.fieldRender = {}
      }
      if(model.fieldRender[key] == undefined) {
        model.fieldRender[key] = property != undefined ? 
          app.get('fieldRenders').reduce((prev, render) => {
            return render(prev, property, field)
          }, null) : null
      }
      if(model.fieldRender[key]) {
        data['componentClass'] = model.fieldRender[key]
      }
      return data
    }
  },
  'model.list.actions': {
    data: ({ modelState }) => {
      return { count: modelState.selected.length, selected: modelState.selected }
    }
  },
  'model.list.btn.count': {
    data: ({ modelState }) => {
      return { count: modelState.count }
    }
  },
  'model.list.btn.pagesize': {
    data: ({ modelState }) => {
      return { size: modelState.filter.limit, sizes: config('pageSizes', [ 15, 30, 50, 100 ]) }
    },
    method: {
      setPageSize: ({ dispatch, model, modelState }) => (size) => {
        dispatch({ model, type: 'GET_ITEMS', filter: { ...modelState.filter, limit: size, skip: 0 } })
      }
    }
  },
  'model.list.btn.cols': {
    data: ({ modelState, model }) => {
      return {
        selected: modelState.filter.fields,
        fields: model.properties
      }
    },
    method: {
      changeFieldDisplay: ({ dispatch, model, modelState }) => (e) => {
        const filter = modelState.filter
        const fields = [].concat(filter.fields || [])
        const field = e[0]
        const selected = e[1]
        const index = _.indexOf(fields, field)

        if (selected) {
          if (index === -1) fields.push(field)
        } else {
          _.remove(fields, (i) => { return i === field })
        }
        dispatch({ model, type: 'GET_ITEMS', filter: { ...filter, fields } })
      }
    }
  },
  'model.page.list': {
    data: ({ model }) => {
      return {
        icon: model.icon || model.name,
        title: model.title,
        canAdd: !!model.permission && !!model.permission.add
      }
    },
    method: {
      addItem: ({ model }, { location }) => () => {
        app.context.router.push({ pathname: `/app/model/${model.name}/add`, query: (location && location.query) || {} })
      }
    }
  },
  'model.page.form': {
    data: ({ model }, { params }) => {
      const { _t } = app.context
      return {
        title: params && params.id ?  _t('Edit {{title}}', { title: model.title }) : _t('Create {{title}}', { title: model.title })
      }
    },
    method: {
      onSuccess: ({ model }) => () => {
        app.context.router.push({ pathname: `/app/model/${model.name}/list` })
      }
    }
  },
  'model.page.detail': {
    data: ({ model }, { params }) => {
      return {
        title: model.title,
        canEdit: !!model.permission && !!model.permission.edit
      }
    },
    method: {
      onClose: ({ model }) => () => {
        app.context.router.push({ pathname: `/app/model/${model.name}/list` })
      },
      onEdit: ({ model }, { params }) => () => {
        app.context.router.push({ pathname: `/app/model/${model.name}/${params.id}/edit` })
      }
    }
  }
}
