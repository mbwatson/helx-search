import { LocationProvider } from '@reach/router'
import { Layout, Space } from 'antd'
import { HelxSearch, SearchForm, SearchResults } from '../components'
import './app.scss'

const { Content, Header } = Layout

export const App = () => {
  return (
    <div className="app">
      <LocationProvider>
        <HelxSearch searchURL="https://helx.renci.org">
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
