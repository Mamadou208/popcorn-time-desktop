// @flow
import Butter from 'api/Butter'
import Database from 'api/Database'

import * as HomeConstants from './HomeConstants'
import * as HomeSelectors from './HomeSelectors'

export const fetchItems = () => ({
  type: HomeConstants.FETCH_ITEMS,
})

export const fetchedItems = (items, mode) => ({
  type   : HomeConstants.FETCHED_ITEMS,
  payload: {
    items,
    mode,
  },
})

export const clearItems = mode => ({
  type   : HomeConstants.CLEAR_ITEMS,
  payload: mode,
})

export const getItems = (mode, page = 1, givenFilters = {}) => (dispatch, getState) => {
  dispatch(fetchItems())

  const { filters: defaultFilters } = HomeSelectors.getModes(getState())[mode]

  const filters = {
    ...defaultFilters,
    ...givenFilters,
  }

  switch (mode) {
    case HomeConstants.MODE_MOVIES:
      return Butter.getMovies(page, filters).then(movies => dispatch(fetchedItems(movies, mode)))

    case HomeConstants.MODE_SHOWS:
      return Butter.getShows(page, filters).then(shows => dispatch(fetchedItems(shows, mode)))

    case HomeConstants.MODE_BOOKMARKS:
      return Database.movies.getAll().then(({ docs: movies }) => {
        dispatch(fetchedItems(movies, mode))

        return Database.shows.getAll().then(({ docs: shows }) => dispatch(fetchedItems(shows, mode)))
      })

    case HomeConstants.MODE_SEARCH:
      dispatch(clearItems(mode))

      return Butter.getMovies(page, filters).then((movies) => {
        dispatch(fetchedItems(movies, mode))

        return Butter.getShows(page, filters).then(shows => dispatch(fetchedItems(shows, mode)))
      })

    default:
      return null
  }
}
