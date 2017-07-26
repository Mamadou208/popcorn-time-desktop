import { connect } from 'redux-clazz'
import Torrent from './Torrent'

import * as TorrentActions from './TorrentActions'
import * as TorrentSelectors from './TorrentSelectors'

export const mapStateToProps = state => ({
  status: TorrentSelectors.getStatus(state),
})

const TorrentAdapter = connect(mapStateToProps, TorrentActions)(Torrent)

export default TorrentAdapter
