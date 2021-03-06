// @flow
import React from 'react'
import classNames from 'classnames'

import type { Props } from './BackgroundTypes'
import classes from './Background.scss'

export const Background = ({ backgroundImage }: Props) => (
  <div
    className={classes.background__container}>
    <div
      className={classNames(classes.background__poster, 'animated fadeIn')}
      style={{ backgroundImage: `url(${backgroundImage})` }}>

      <div className={classes.background__overlay} />
    </div>
  </div>
)

export default Background
