import { Routes, Route } from "react-router-dom";

import AdminLayout from "../layout/AdminLayout";

import Dashboard from "../pages/Dashboard";
import ProductsAdmin from "../pages/ProductsAdmin";
import CategoriesAdmin from "../pages/CategoriesAdmin";
import OrdersAdmin from "../pages/OrdersAdmin";
import CustomersAdmin from "../pages/CustomersAdmin";
import FlashSaleAdmin from "../pages/FlashSaleAdmin";
import ReviewsAdmin from "../pages/ReviewsAdmin";
import AnalyticsAdmin from "../pages/AnalyticsAdmin";
import SettingsAdmin from "../pages/SettingsAdmin";

function AdminRoutes() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="products" element={<ProductsAdmin />} />
        <Route path="categories" element={<CategoriesAdmin />} />
        <Route path="orders" element={<OrdersAdmin />} />
        <Route path="customers" element={<CustomersAdmin />} />
        <Route path="flash-sale" element={<FlashSaleAdmin />} />
        <Route path="reviews" element={<ReviewsAdmin />} />
        <Route path="analytics" element={<AnalyticsAdmin />} />
        <Route path="settings" element={<SettingsAdmin />} />
      </Route>
    </Routes>
  );
}

export default AdminRoutes;