import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "../features/cart/cartSlice"
import favouriteReducer from "../features/favourite/favourite"



export const store = configureStore({
    reducer: {
        cart: cartReducer,
        favourite: favouriteReducer
    }
})