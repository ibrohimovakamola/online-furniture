import { createSlice } from "@reduxjs/toolkit";



const initialState = {
    items: []
}


const favouriteSlice = createSlice({
    name: "favourite",
    initialState,
    reducers:{
        addToFavourite: (state, action)=>{
            const itemIndex = state.items.findIndex(
                item => item.id === action.payload.id
            )
            if(itemIndex >= 0){
                state.items[itemIndex].quantity += action.payload.quantity
            }else{
                state.items.push({
                    ...action.payload, quantity: action.payload.quantity || 1
                })
            }
        },
        clearCart: (state)=>{
            state.items = []
        }
    }
})

export const {addToFavourite, clearCart} = favouriteSlice.actions
export default favouriteSlice.reducer