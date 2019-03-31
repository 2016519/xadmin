import React from 'react'
import _ from 'lodash'
import { Form, InputGroup, Button } from 'react-bootstrap'
import Icon from 'react-fontawesome'
import app from 'xadmin'
import { ModelWrap } from 'xadmin-model'

@ModelWrap('model.searchbar')
class SearchBar extends React.Component {

  constructor(props, context) {
    super(props, context)
    this.state = { value: props.searchValue || '' }
  }

  onSearch(e) {
    this.props.onSearch(this.state.value || '')
    event.preventDefault()
  }

  onClean(e) {
    this.setState({ value: '' })
    this.props.onSearch('')
  }

  onKeyPress(e) {
    if (e.keyCode == 13) {
      this.onSearch(e)
    }
  }

  render() {
    const { _t } = app.context
    const { searchValue, searchTitles } = this.props
    if(searchTitles && searchTitles.length > 0) {
      const placeholder = _t('Search') + ' ' + searchTitles.join(', ')
      return (
        <Form inline onSubmit={this.onSearch.bind(this)}>
          <InputGroup>
            <Form.Control value={this.state.value} 
              onKeyPress={this.onKeyPress.bind(this)}
              placeholder={placeholder} onChange={(e)=>{this.setState({ value: e.target.value })}} />
            <InputGroup.Append>
              <Button type="submit"><Icon name="search" /></Button>
            </InputGroup.Append>
          </InputGroup>
        </Form>
      )
    }
    return null
  }

}

export default {
  name: 'xadmin.model.search',
  blocks: {
    'model.list.nav': (props) => <SearchBar key="searchBar" {...props} />
  },
  mappers: {
    'model.searchbar': {
      data: ({ model, modelState }) => {
        return {
          searchFields: model.search_fields,
          searchValue: modelState.filter.search
        }
      },
      compute: ({ model, modelState }) => {
        return {
          searchTitles: model.search_fields && model.search_fields.map(field => model.properties[field].title || field)
        }
      },
      method: {
        onSearch: ({ dispatch, model, modelState }) => (search) => {
          let wheres = modelState.wheres || {}
          if(search) {
            const searchs = model.search_fields.map(field => {
              return { [field]: { like: search } }
            })
            if(searchs.length > 1) {
              wheres['searchbar'] = { or: searchs }
            } else if(searchs.length > 0) {
              wheres['searchbar'] = searchs[0]
            }
          } else {
            wheres = _.omit(wheres, 'searchbar')
          }
          dispatch({ model, type: 'GET_ITEMS', filter: { ...modelState.filter, skip: 0, search }, wheres })
        }
      }
    }
  }
}
export { SearchBar }
