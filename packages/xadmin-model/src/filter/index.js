import React from 'react'
import _ from 'lodash'
import { Field, reduxForm, reducer as formReducer, reset, change, clearFields, initialize, getFormValues, getFormMeta } from 'redux-form'
import Icon from 'react-fontawesome'
import app from 'xadmin'
import { Nav, ButtonGroup, Panel, Modal, Navbar, NavItem, NavDropdown, MenuItem, OverlayTrigger, Popover, Badge, Button, Col, Row, FormGroup, ControlLabel, FormControl, HelpBlock } from 'react-bootstrap'
import { BaseForm } from 'xadmin-form'
import { InlineGroup, SimpleGroup } from 'xadmin-form/lib/components/base'

import { ModelWrap } from '../index'
import { getFieldProp } from '../utils'
import filter_converter from './filters'
import filter_fields from './fields'

const convert = (schema, options) => {
  const opts = options || {}
  return app.load_list('filter_converter').reduce((prve, converter) => {
    return converter(prve, schema, opts)
  }, {})
}

const FilterForm = (props) => {
  const { formKey, filters, fieldProps } = props
  const fields = filters.map(filter => {
    const field = convert(filter.schema, { key: filter.key })
    return _.merge(field, filter.field, fieldProps)
  })
  const WrapForm = reduxForm({ 
    form: formKey,
    enableReinitialize: true
  })(BaseForm)
  return <WrapForm fields={fields} {...props}/>
}

class FilterComponent extends React.Component {

  shouldComponentUpdate(nextProps, nextState) {
    return this.state != nextState
  }

}

class FilterDiv extends React.Component {

  render() {
    const { _t } = app.context
    const { filters, formKey, data, changeFilter, resetFilter } = this.props
    const FormLayout = (props) => {
      const { children, invalid, pristine, handleSubmit, submitting } = props
      return (
        <form className="form-horizontal" onSubmit={handleSubmit}>
          {children}
          <Row>
            <Col sm={9} xsOffset={3} >
              <Button disabled={invalid || submitting} onClick={handleSubmit} bsStyle="primary">{_t('Search')}</Button>
              {' '}
              <Button disabled={submitting} onClick={resetFilter} bsStyle="default">{_t('Clear')}</Button>
            </Col>
          </Row>
        </form>
      )
    }
    return (<FilterForm
      formKey={formKey}
      filters={filters}
      component={FormLayout}
      initialValues={data}
      onSubmit={changeFilter}
      fieldProps={{ mode: 'base' }}
    />)
  }

}

class FilterInline extends React.Component {

  render() {
    const { _t } = app.context
    const { filters, formKey, data, changeFilter, resetFilter, groupSize } = this.props

    const FormLayout = (props) => {
      const { children, invalid, pristine, handleSubmit, submitting } = props
      return (
        <form className="form-horizontal" onSubmit={handleSubmit}>
          <Row style={{ marginBottom: '-5px' }}>
            {children}
          </Row>
          <Row>
            <Col style={{ textAlign: 'center' }} sm={12}>
              <Button disabled={invalid || submitting} bsSize="sm" onClick={handleSubmit} bsStyle="primary">{_t('Search')}</Button>
              {' '}
              <Button disabled={submitting} onClick={resetFilter} bsSize="sm" bsStyle="default">{_t('Clear')}</Button>
            </Col>
          </Row>
        </form>
      )
    }
    const groupComponent = ({ id, label, help, error, groupProps, children }) => {
      return (
        <Col key={0} sm={6} md={4} lg={4} {...groupSize}>
          <FormGroup controlId={id} {...groupProps}>
            <Col key={0} componentClass={ControlLabel} sm={2} md={5} lg={4}>
              {label}
            </Col>
            <Col key={1} sm={10} md={7} lg={8}>
              {children}
              <FormControl.Feedback />
              {help && <HelpBlock>{help}</HelpBlock>}
              {error && <HelpBlock>{error}</HelpBlock>}
            </Col>
          </FormGroup>
        </Col>
      )
    }
    return (<FilterForm
      formKey={formKey}
      filters={filters}
      component={FormLayout}
      initialValues={data}
      onSubmit={changeFilter}
      group={groupComponent}
      fieldProps={{ attrs: { bsSize: 'sm' }, mode: 'mini' }}
    />)
  }

}

@ModelWrap('model.list.filter')
class FilterMenu extends FilterComponent {

  render() {
    const { _t } = app.context
    const { filters, formKey, data, changeFilter, resetFilter } = this.props

    if(filters && filters.length) {
      const FormLayout = (props) => {
        const { children, invalid, pristine, handleSubmit, submitting } = props
        return (
          <Panel>
            <Panel.Heading>{_t('Filter Form')}</Panel.Heading>
            <Panel.Body>
              <form onSubmit={handleSubmit}>
                {children}
                <ButtonGroup justified>
                  <Button style={{ width: '30%' }} disabled={submitting} onClick={resetFilter} bsStyle="default">{_t('Clear')}</Button>
                  <Button style={{ width: '70%' }} disabled={invalid || submitting} onClick={handleSubmit} bsStyle="primary">{_t('Search')}</Button>
                </ButtonGroup>
              </form>
            </Panel.Body>
          </Panel>
        )
      }
      return (<FilterForm
        formKey={formKey}
        filters={filters}
        component={FormLayout}
        initialValues={data}
        onSubmit={changeFilter}
        group={SimpleGroup}
      />)
    } else {
      return null
    }
  }

}

@ModelWrap('model.list.filter')
class FilterPopover extends FilterComponent {

  render() {
    const { _t } = app.context
    const { filters, data } = this.props
    if(filters && filters.length) {
      return (
        <OverlayTrigger trigger="click" rootClose={false} placement="bottom" overlay={
          <Popover style={{ maxWidth: 580 }}>
            <FilterDiv {...this.props}/>
          </Popover>}>
          <NavItem><Icon name="filter" /> {_t('Filter')} {(data && Object.keys(data).length) ? (<Badge>{Object.keys(data).length}</Badge>) : null}</NavItem>
        </OverlayTrigger>)
    } else {
      return null
    }
  }

}

@ModelWrap('model.list.filter')
class FilterModal extends FilterComponent {

  state = { show: false }

  onClose() {
    this.setState({ show: false })
  }

  shouldComponentUpdate() {
    return true
  }

  renderFilterForm() {
    const { _t } = app.context
    const { filters, formKey, data, changeFilter, resetFilter } = this.props
    const onClose = this.onClose.bind(this)
    
    const FormLayout = (props) => {
      const { children, invalid, pristine, handleSubmit, submitting } = props
      return (
        <form className="form-horizontal" onSubmit={handleSubmit}>
          <Modal.Body>
            {children}
          </Modal.Body>
          <Modal.Footer>
            <Button disabled={submitting} onClick={()=>{
              resetFilter()
              onClose()
            }} bsStyle="default">{_t('Clear')}</Button>
            <Button disabled={invalid || submitting} onClick={()=>{
              handleSubmit()
              onClose()
            }} bsStyle="primary">{_t('Search')}</Button>
          </Modal.Footer>
        </form>
      )
    }
    return (<FilterForm
      formKey={formKey}
      filters={filters}
      component={FormLayout}
      initialValues={data}
      onSubmit={changeFilter}
      fieldProps={{ mode: 'base' }}
    />)
  }

  renderModal() {
    const { _t } = app.context
    return (
      <Modal show={this.state.show} onHide={this.onClose.bind(this)}>
        <Modal.Header closeButton>
          <Modal.Title>{_t('Filter Form')}</Modal.Title>
        </Modal.Header>
        {this.renderFilterForm()}
      </Modal>
    )
  }

  render() {
    const { _t } = app.context
    const { filters, data } = this.props
    if(filters && filters.length) {
      return [
        (<NavItem onClick={()=>this.setState({ show: true })}>
          <Icon name="filter" /> {_t('Filter')} {(data && Object.keys(data).length) ? (<Badge>{Object.keys(data).length}</Badge>) : null}
        </NavItem>),
        this.renderModal()
      ]
    } else {
      return null
    }
  }

}

@ModelWrap('model.list.filter')
class FilterSubMenu extends FilterComponent {

  render() {
    const { filters } = this.props
    return filters && filters.length ? (<Panel><Panel.Body><FilterInline {...this.props}/></Panel.Body></Panel>) : null
  }

}

@ModelWrap('model.list.filter')
class FilterNavForm extends FilterComponent {

  renderFilterForm() {
    const { _t } = app.context
    const { filters, formKey, data, changeFilter, resetFilter } = this.props
    const FormLayout = (props) => {
      const { children, invalid, pristine, handleSubmit, submitting } = props
      return (
        <Navbar.Form pullRight onSubmit={handleSubmit}>
          {children}{' '}
          <Button disabled={invalid || submitting} onClick={handleSubmit} bsStyle="primary">{_t('Search')}</Button>
          {' '}
          <Button disabled={submitting} onClick={resetFilter} bsStyle="default">{_t('Clear')}</Button>
        </Navbar.Form>
      )
    }
    return (<FilterForm
      formKey={formKey}
      filters={filters}
      component={FormLayout}
      initialValues={data}
      onSubmit={changeFilter}
      group={InlineGroup}
      fieldProps={{ mode: 'base' }}
    />)
  }

  render() {
    const { filters } = this.props
    if(filters && filters.length) {
      return this.renderFilterForm()
    } else {
      return null
    }
  }

}

const block_func = (Filter, name) => ({ model }) => (
  (model && model.filters && model.filters[name]) ? <Filter name={name} /> : null
)

export default {
  name: 'xadmin.filter',
  blocks: {
    'model.list.nav': () => [ <FilterModal name="nav" />, <FilterNavForm name="navform" /> ],
    'model.list.modal': block_func(FilterModal, 'modal'),
    'model.list.popover': block_func(FilterPopover, 'popover'),
    'model.list.submenu': block_func(FilterSubMenu, 'submenu'),
    'model.list.sidemenu': block_func(FilterMenu, 'sidemenu')
  },
  mappers: {
    'model.list.filter': {
      data: ({ model, modelState }, { name }) => {
        return {
          data: modelState.wheres.filters
        }
      },
      compute: ({ model, modelState }, { data, name }) => {
        const filters = (model.filters ? (model.filters[name] || []) : []).map(filter => {
          const key = typeof filter == 'string' ? filter : filter.key
          const schema = getFieldProp(model, key)
          return schema ? {
            key, schema,
            field: typeof filter == 'string' ? { } : filter
          } : null
        }).filter(Boolean)
        return {
          filters, data: _.clone(data),
          formKey: `filter.${model.name}`
        }
      },
      method: {
        resetFilter: ({ dispatch, model, state, modelState }) => (e) => {
          const formKey = `filter.${model.name}`
          const initial = _.isFunction(model.initialValues) ? model.initialValues() : model.initialValues
          const where = initial && initial.wheres && initial.wheres.filters || {}
          const values = { ...getFormValues(formKey)(state), ...where }
          const cf = []
          Object.keys(values).forEach(field => {
            if(where[field] !== undefined) {
              dispatch(change(formKey, field, where[field]))
            } else {
              cf.push(field)
            }
          })
          if(cf.length > 0) {
            dispatch(clearFields(formKey, false, false, ...cf))
          }

          const wheres = (Object.keys(where).length > 0 ? 
            { ...modelState.wheres, filters: where } : _.omit(modelState.wheres, 'filters'))

          dispatch({ model, type: 'GET_ITEMS', filter: { ...modelState.filter, skip: 0 }, wheres })
        },
        changeFilter: ({ dispatch, model, state, modelState }, { name }) => () => {
          const values = getFormValues(`filter.${model.name}`)(state)
          const where = Object.keys(values).reduce((prev, key) => {
            if(!_.isNil(values[key])) {
              prev[key] = values[key]
            } else {
              prev = _.omit(prev, key)
            }
            return prev
          }, { ...modelState.wheres.filters })
          const wheres = (Object.keys(where).length > 0 ? 
            { ...modelState.wheres, filters: where } : _.omit(modelState.wheres, 'filters'))
          dispatch({ model, type: 'GET_ITEMS', filter: { ...modelState.filter, skip: 0 }, wheres })
        }
      }
      // event: {
      //   mount: ({ dispatch, model }) => {
      //     if(model.filterDefault) {
      //       const values = _.isFunction(model.filterDefault) ? model.filterDefault() : model.filterDefault
      //       dispatch(initialize(`filter.${model.name}`, values))
      //     }
      //   }
      // }
    }
  },
  form_fields: filter_fields,
  filter_converter
}
const FilterNav = FilterModal
export {
  FilterForm,
  FilterSubMenu,
  FilterPopover,
  FilterNavForm,
  FilterMenu,
  FilterModal,
  FilterNav
}
