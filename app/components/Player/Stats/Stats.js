// @flow
import React from 'react'
import classNames from 'classnames'

import * as TorrentConstants from 'api/Torrent/TorrentConstants'
import itemClasses from 'components/Item/Item.scss'
import type { Props } from './StatsTypes'
import classes from './Stats.scss'

export class Stats extends React.Component {

  props: Props

  status = {
    [TorrentConstants.STATUS_CONNECTING] : 'Connecting...',
    [TorrentConstants.STATUS_DOWNLOADING]: 'Downloading...',
    [TorrentConstants.STATUS_BUFFERING]  : 'Buffering...',
    [TorrentConstants.STATUS_DOWNLOADED] : 'Complete',
  }

  sizes = ['Bytes/s', 'KB/s', 'MB/s']

  formatKbToString = (bytes) => {
    if (bytes === 0) {
      return '0 Byte'
    }

    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10)

    return `${(bytes / (1024 ** i)).toFixed(2)} ${this.sizes[i]}`
  }

  formatMillisToMinutesAndSeconds = (millis) => {
    const minutes = Math.floor(millis / 60000)
    const seconds = ((millis % 60000) / 1000).toFixed(0)

    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds} minutes`
  }

  shouldShowStop = () => {
    const { torrentStatus } = this.props

    return torrentStatus === TorrentConstants.STATUS_CONNECTING
           || torrentStatus === TorrentConstants.STATUS_BUFFERING
  }

  render() {
    const { item, torrentStatus, stats, stop }                           = this.props
    const { downloadSpeed, uploadSpeed, peers, progress, timeRemaining } = stats

    const style = {
      opacity: torrentStatus === TorrentConstants.STATUS_DOWNLOADED ? 0 : 1,
    }

    return (
      <div className={classNames(itemClasses.content__container, classes.stats)}>
        <h1 className={'row-margin'}>
          {item.title}
        </h1>

        <h6 className={classes.stats__text}>
          {this.status[torrentStatus]}
        </h6>

        <div style={style}>Download {this.formatKbToString(downloadSpeed)}</div>
        <div style={style}>Upload {this.formatKbToString(uploadSpeed)}</div>
        <div style={style}>Peers {peers}</div>

        <div style={style} className={classes.progress}>
          <span
            style={{ width: `${parseFloat(progress * 100).toFixed(2)}%` }}>
            {parseFloat(progress * 100).toFixed(2)}%
          </span>
        </div>

        <div style={style}>Time left {this.formatMillisToMinutesAndSeconds(timeRemaining)}</div>

        {this.shouldShowStop() && (
          <div>
            <button
              className={'pct-btn pct-btn-trans pct-btn-outline pct-btn-round'}
              onClick={stop}>
              Cancel
            </button>
          </div>
        )}

      </div>
    )
  }
}

export default Stats
