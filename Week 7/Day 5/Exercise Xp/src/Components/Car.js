import { useState } from 'react'
import Garage from './Garage.js'

function Car({ carInfo }) {
  const [color] = useState('red')

  return (
    <div>
      <h3>
        This car is {color} {carInfo.model}
      </h3>
      <Garage size="small" />
    </div>
  )
}

export default Car
