import { createSlice } from '@reduxjs/toolkit'
import React from 'react'


const initialState = {
    items: []
}

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action)=>{
            const itemIndex = state.items.findIndex(
                item => item.id === action.payload.id
            )
            if(itemIndex >= 0){
                state.items[itemIndex].quantity += action.payload.quantity
            }else{
                state.items.push({
                    ...action.payload,
                    quantity: action.payload.quantity || 1
                })
            }
        }
    }
})

export const {addToCart} = cartSlice.actions
export default cartSlice.reducer