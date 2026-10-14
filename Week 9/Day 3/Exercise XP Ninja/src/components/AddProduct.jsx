import { useState } from 'react'
import { nanoid } from '@reduxjs/toolkit'
import { useDispatch } from 'react-redux'
import { addProduct } from '../redux/inventorySlice.js'

function AddProduct() {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('0')
  const [price, setPrice] = useState('0')
  const dispatch = useDispatch()

  function handleSubmit(event) {
    event.preventDefault()
    const productName = name.trim()
    if (!productName) return

    dispatch(addProduct({
      id: nanoid(),
      name: productName,
      quantity: Number(quantity),
      price: Number(price),
    }))
    setName('')
    setQuantity('0')
    setPrice('0')
  }

  return (
    <form className="add-product-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <div>
          <p className="eyebrow">ADD TO INVENTORY</p>
          <h2>New product</h2>
        </div>
        <span className="form-step">01 / 01</span>
      </div>

      <div className="form-fields">
        <label className="name-field" htmlFor="product-name">
          Product name
          <input
            id="product-name"
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Ceramic mug"
            required
            value={name}
          />
        </label>
        <label htmlFor="product-quantity">
          Quantity
          <input
            id="product-quantity"
            min="0"
            onChange={(event) => setQuantity(event.target.value)}
            required
            type="number"
            value={quantity}
          />
        </label>
        <label htmlFor="product-price">
          Unit price ($)
          <input
            id="product-price"
            min="0"
            onChange={(event) => setPrice(event.target.value)}
            required
            step="0.01"
            type="number"
            value={price}
          />
        </label>
      </div>

      <button className="add-button" type="submit">
        <span aria-hidden="true">+</span>
        Add product
      </button>
    </form>
  )
}

export default AddProduct
