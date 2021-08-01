import { LocationProvider } from '@reach/router'
import { Layout, Space } from 'antd'
import { HelxSearch, SearchForm, SearchResults } from './components'
import './app.scss'

const { Content, Header } = Layout

const config = {
  searchURL: 'https://helx.renci.org',
  basePath: '',
}

const SemanticSearch = () => {
  return (
    <div className="app">
      <LocationProvider>
        <HelxSearch { ...config }>
          <div className="search-header">
            <SearchForm />
          </div>
          <Content className="results-container">
            <SearchResults />
          </Content>
        </HelxSearch>
      </LocationProvider>
    </div>
  )
}

export default SemanticSearch
