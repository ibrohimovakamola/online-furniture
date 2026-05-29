import { configureStore } from "@reduxjs/toolkit";
import cartReducer from "../features/cart/cartSlice"
import favouriteReducer from "../features/favourite/favourite"
import authReducer from "../features/auth/authSlice"
import adminReducer from "../features/admin/store/adminSlice"
import catalogReducer from "../features/catalog/catalogSlice"
import settingsReducer from "../features/settings/settingsSlice"

export const store = configureStore({
    reducer: {
        cart: cartReducer,
        favourite: favouriteReducer,
        auth: authReducer,
        admin: adminReducer,
        catalog: catalogReducer,
        settings: settingsReducer,
    }
})