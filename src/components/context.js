import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useLocation, useNavigate } from '@reach/router'
import './search.css'
import { SearchResultModal } from './'

//

export const HelxSearchContext = createContext({})
export const useHelxSearch = () => useContext(HelxSearchContext)

//

const PER_PAGE = 20
const tempSearchFacets = [
  'ALL',
  'Biolink',
  'CDE',
  'Harmonized',
  'LOINC',
  'PhenX',
].sort((f, g) => f.toLowerCase() < g.toLowerCase() ? -1 : 1)

//

const validateResult = result => {
  return result.description.trim() && result.name.trim()
}

export const HelxSearch = ({ searchURL = 'https://helx.renci.org', basePath = '', children }) => {
  const [query, setQuery] = useState('')
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [error, setError] = useState({})
  const [results, setResults] = useState([])
  const [totalResults, setTotalResults] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageCount, setPageCount] = useState(0)
  const location = useLocation()
  const [selectedResult, setSelectedResult] = useState(null)

  const inputRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    // this lets the user press backslash to jump focus to the search box
    const handleKeyPress = event => {
      if (event.keyCode === 220) { // backslash ("\") key 
        if (inputRef.current) {
          event.preventDefault()
          inputRef.current.select()
          window.scroll({ top: 0 })
        }
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)
    setQuery(queryParams.get('q') || '')
    setCurrentPage(+queryParams.get('p') || 1)
  }, [location.search])

  const validationReducer = (buckets, hit) => {
    const valid = validateResult(hit)
    if (valid) {
      return { valid: [...buckets.valid, hit], invalid: buckets.invalid }
    } else {
      return { valid: buckets.valid, invalid: [...buckets.invalid, hit] }
    }
  }

  useEffect(() => {
    const fetchResults = async () => {
      setIsLoadingResults(true)
      try {
        const params = {
          index: 'concepts_index',
          query: query,
          offset: (currentPage - 1) * PER_PAGE,
          size: PER_PAGE,
        }
        const response = await axios.post(`${searchURL}/search`, params)
        if (response.status === 200 && response.data.status === 'success' && response?.data?.result?.hits) {
          const unsortedHits = response.data.result.hits.hits.map(r => r._source)
          // gather invalid results: remove from rendered results and dump to console.
          let hits = unsortedHits.reduce(validationReducer, { valid: [], invalid: [] })
          if (hits.invalid.length) {
            console.error(`The following ${ hits.invalid.length } invalid results ` + 
              `were removed from the ${ hits.valid.length + hits.invalid.length } ` +
              `returned results:`, hits.invalid)
          }
          setResults(hits.valid)
          setTotalResults(response.data.result.total_items)
          setIsLoadingResults(false)
        } else {
          setResults([])
          setTotalResults(0)
          setIsLoadingResults(false)
        }
      } catch (error) {
        console.log(error)
        setError({ message: 'An error occurred!' })
        setIsLoadingResults(false)
      }
    }
    if (query) {
      fetchResults()
    }
  }, [query, currentPage, searchURL, setResults, setError])

  useEffect(() => {
    setPageCount(Math.ceil(totalResults / PER_PAGE))
  }, [totalResults])

  const fetchKnowledgeGraphs = useCallback(async (tag_id) => {
    try {
      const { data } =  await axios.post(`${searchURL}/search_kg`, {
        index: 'kg_index',
        unique_id: tag_id,
        query: query,
        size: 100,
      })
      if (!data || data.result.total_items === 0) {
        return []
      }
      return data.result.hits.hits.map(graph => graph._source.knowledge_graph.knowledge_graph)
    } catch (error) {
      console.error(error)
    }
  }, [searchURL, results])

  const fetchStudyVariables = useCallback(async (_id, _query) => {
    try {
      const { data } = await axios.post(`${searchURL}/search_var`, {
        concept: _id,
        index: 'variables_index',
        query: _query,
        size: 1000
      })
      if (!data) {
        return []
      }
      return data
      // return []
    } catch (error) {
      console.error(error)
    }
  }, [searchURL, results])

  const doSearch = queryString => {
    const trimmedQuery = queryString.trim()
    if (trimmedQuery !== '') {
      setQuery(trimmedQuery)
      setCurrentPage(1)
      navigate(`${ basePath }?q=${trimmedQuery}&p=1`)
    }
  }


  return (
    <HelxSearchContext.Provider value={{
      query, setQuery, doSearch, fetchKnowledgeGraphs, fetchStudyVariables, inputRef,
      error, isLoadingResults,
      results, totalResults,
      currentPage, setCurrentPage, perPage: PER_PAGE, pageCount,
      facets: tempSearchFacets,
      selectedResult, setSelectedResult,
    }}>
      { children }
      <SearchResultModal
        result={ selectedResult }
        visible={ selectedResult !== null}
        closeHandler={ () => setSelectedResult(null) }
      />
    </HelxSearchContext.Provider>
  )
}
