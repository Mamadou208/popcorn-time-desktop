// @flow
import React from 'react'
import { Link } from 'react-router-dom'

import type { Props } from './CardTypes'

import Cover from './Cover'
import classes from './Card.scss'

export const Card = ({ item }: Props) => (
  <div className={classes.card}>

    <Cover item={item} />

    <div className={classes.card__description}>
      <Link className={classes.card__title} replace to={`/${item.type}/${item.id}`}>
        {item.title}
      </Link>
    </div>

  </div>
)

export default Card
