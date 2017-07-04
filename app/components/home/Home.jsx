// @flow
/* eslint react/no-unused-prop-types: 0 */
import React, { Component } from 'react';
import VisibilitySensor from 'react-visibility-sensor';
import Butter from '../../api/Butter';
import Header from '../header/Header.jsx';
import CardList from '../card/CardList.jsx';
import type { Props }from './HomeConstants'

export default class Home extends Component {
  props: Props;

  butter: Butter;

  didMount: boolean;

  constructor(props: Props) {
    super(props);
    this.butter = new Butter();

    // Temporary hack to preserve scroll position
    if (!global.pct) {
      global.pct = {
        moviesScrollTop: 0,
        showsScrollTop : 0,
        searchScrollTop: 0
      };
    }
  }

  onChange = async (isVisible: boolean) => {
    const { isLoading, activeMode, activeModeOptions } = this.props

    if (isVisible && !isLoading) {
      await this.paginate(activeMode, activeModeOptions);
    }
  }

  /**
   * Return movies and finished status without mutation
   * @TODO: Migrate this to redux
   * @TODO: Determine if query has reached last page
   *
   * @param {string} queryType   | 'search', 'movies', 'shows', etc
   * @param {object} queryParams | { searchQuery: 'game of thrones' }
   * @param {activeModeOptionsType} activeModeOptions
   */
  paginate = async (queryType: string, activeModeOptions: activeModeOptionsType = {}) => {
    this.props.setLoading(true);

    // HACK: This is a temporary solution.
    // Waiting on: https://github.com/yannickcr/eslint-plugin-react/issues/818

    const { limit, page } = this.props.modes[queryType];

    const items = await (async () => {
      switch (queryType) {
        case 'search': {
          return this.butter.search(activeModeOptions.searchQuery, page);
        }
        case 'movies':
          return this.butter.getMovies(page, limit);
        case 'shows':
          return this.butter.getShows(page, limit);
        default:
          return this.butter.getMovies(page, limit);
      }
    })();

    this.props.paginate(items);
    this.props.setLoading(false);

    return items;
  }

  /**
   * If bottom of component is 2000px from viewport, query
   */
  initInfinitePagination = () => {
    if (this.props.infinitePagination) {
      const scrollDimentions = document.querySelector('body')
                                       .getBoundingClientRect();

      if (scrollDimentions.bottom < 2000 && !this.props.isLoading) {
        this.paginate(this.props.activeMode, this.props.activeModeOptions);
      }
    }
  }

  componentDidMount() {
    this.didMount = true;
    document.addEventListener('scroll', this.initInfinitePagination);
    window.scrollTo(0, global.pct[`${this.props.activeMode}ScrollTop`]);
  }

  componentWillReceiveProps(nextProps: Props) {
    global.pct[`${this.props.activeMode}ScrollTop`] = document.body.scrollTop;

    if (JSON.stringify(nextProps.activeModeOptions) !== JSON.stringify(this.props.activeModeOptions)) {
      if (nextProps.activeMode === 'search') {
        this.props.clearAllItems();
      }

      this.paginate(nextProps.activeMode, nextProps.activeModeOptions);
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.activeMode !== this.props.activeMode) {
      window.scrollTo(0, global.pct[`${this.props.activeMode}ScrollTop`]);
    }
  }

  componentWillUnmount() {
    if (!document.body) {
      throw new Error('"document" not defined. You are probably not running in the renderer process');
    }

    global.pct[`${this.props.activeMode}ScrollTop`] = document.body.scrollTop;

    this.didMount = false;
    document.removeEventListener(
      'scroll',
      this.initInfinitePagination
    );
  }

  render() {
    const { activeMode, setActiveMode, items, isLoading } = this.props;

    return (
      <div style={{marginRight: -8}}>
        <Header activeMode={activeMode} setActiveMode={setActiveMode} />

        <div style={{ padding: 25 }}>
          <CardList items={items} isLoading={isLoading} />
          <VisibilitySensor onChange={this.onChange} />
        </div>
      </div>
    );
  }
}
