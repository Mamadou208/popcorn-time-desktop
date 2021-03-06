// @flow
import ReduxClazz from 'redux-clazz'
import chromecastAPI from 'chromecasts'
import debug from 'debug'
import network from 'network-address'

import Power from 'api/Power'
import * as PlayerConstants from 'api/Player/PlayerConstants'
import type { ContentType } from 'api/Metadata/MetadataTypes'
import type { DeviceType } from '../StreamingTypes'
import { StreamingInterface } from '../StreamingInterface'
import type { ChromeCastApiType, ChromeCastType } from './ChromeCastTypes'

const log = debug('api:players:chromecast')

export default class extends ReduxClazz implements StreamingInterface {

  provider: string = 'Chromecast'

  supportsSubtitles: boolean = true

  selectedDevice: ChromeCastType

  devices: Array<ChromeCastType> = []

  chromecasts: ChromeCastApiType

  status: string = PlayerConstants.STATUS_NONE

  checkProgressInterval: number

  loadedItem: ContentType

  states = {
    PLAYING  : PlayerConstants.STATUS_PLAYING,
    BUFFERING: PlayerConstants.STATUS_BUFFERING,
    PAUSED   : PlayerConstants.STATUS_PAUSED,
    IDLE     : PlayerConstants.STATUS_NONE,
    FINISHED : PlayerConstants.STATUS_ENDED,
  }

  constructor(...props) {
    super(...props)

    this.chromecasts = chromecastAPI()
    this.chromecasts.on('update', this.onChromecastsUpdate)
  }

  onChromecastsUpdate = player => this.devices.push(player)

  getDevices = (timeout: number = 1000) => new Promise((resolve) => {
    this.chromecasts.update()

    setTimeout(() => {
      resolve(this.devices.map(device => ({
        name    : device.name,
        host    : device.host,
        provider: this.provider,
      })))
    }, timeout)
  })

  selectDevice = (device: DeviceType) => {
    log(`Selecting device ${device.name}`)

    this.selectedDevice = this.devices.find(chromecast => chromecast.host === device.host)
  }

  play = (uri: string, item: ContentType) => {
    if (this.status !== PlayerConstants.STATUS_NONE) {
      return
    }

    log(`Play ${item.title}`)

    let streamingUrl = uri
    if (uri.indexOf('localhost')) {
      streamingUrl = uri.replace('localhost', network())
    }

    if (!this.selectedDevice) {
      throw new Error('No device selected')
    }

    Power.enableSaveMode()
    log(`Connecting to: ${this.selectedDevice.name} (${this.selectedDevice.host})`)

    this.updateStatus(PlayerConstants.STATUS_CONNECTING)
    this.loadedItem = item
    const media     = {
      type: 'video/mp4',
      // tracks: <-- For subtitles

      autoSubtitles: false,
      metadata     : {
        type        : 0,
        metadataType: 0,
        title       : item.title,
        images      : [{
          url: item.images.poster.medium,
        }],
      },
    }

    this.selectedDevice.play(streamingUrl, media, () => {
      this.selectedDevice.on('status', (status) => {
        if (status && status.playerState === 'IDLE') {
          this.updateStatus(this.states[status.idleReason])

        } else {
          this.updateStatus(this.states[status.playerState])
        }
      })
    })
  }

  togglePlay = () => {
    log('Toggle Play...')
    if (this.selectedDevice && this.status !== PlayerConstants.STATUS_NONE) {
      if (this.status === PlayerConstants.STATUS_PAUSED) {
        this.selectedDevice.play()

      } else {
        this.selectedDevice.pause()
      }
    }
  }

  stop = () => {
    log('Stop...')
    if (this.selectedDevice && this.status !== PlayerConstants.STATUS_NONE) {
      this.selectedDevice.stop()
    }
  }

  isPlaying = () => this.status === PlayerConstants.STATUS_PLAYING

  updateStatus = (nStatus) => {
    log('updateStatus', nStatus)
    const newStatus = nStatus && nStatus !== 'undefined' ? nStatus : PlayerConstants.STATUS_NONE

    if (newStatus !== this.status) {
      log(`Update status to ${newStatus}`)
      const { updateStatus } = this.props

      this.status = newStatus
      updateStatus(newStatus)
      this.clearIntervals()

      if (newStatus === PlayerConstants.STATUS_PLAYING) {
        this.checkProgressInterval = this.progressInterval()

      } else if (newStatus === PlayerConstants.STATUS_NONE) {
        this.destroyPlayer()
      }
    }
  }

  progressInterval = () => setInterval(() => {
    if (this.selectedDevice) {
      this.selectedDevice.status((err, data) => {
        if (typeof data !== 'undefined') {
          const { updatePercentage } = this.props
          const percentage           = (data.currentTime / data.media.duration) * 100

          if (percentage > 95) {
            this.clearIntervals()

            updatePercentage(this.loadedItem, 100)

          } else {
            updatePercentage(this.loadedItem, percentage)
          }

        } else {
          this.clearIntervals()
          this.destroy()
        }
      })
    }
  }, 10000)

  clearIntervals = () => {
    if (this.checkProgressInterval) {
      clearInterval(this.checkProgressInterval)
    }
  }

  destroy = () => {
    if (this.status !== PlayerConstants.STATUS_NONE) {
      log('Destroy...')
      this.destroyPlayer()

      this.updateStatus(PlayerConstants.STATUS_NONE)
    }
  }

  destroyPlayer = () => {
    Power.disableSaveMode()

    if (this.selectedDevice) {
      this.selectedDevice.stop()
    }

    if (this.chromecasts) {
      this.chromecasts.destroy()
    }
  }
}
