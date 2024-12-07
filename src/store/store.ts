import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authentication/authSlice";
import userReducer from "./user/userSlice";
import collaboratorReducer from "./collaborator/collaboratorSlice";
import productReducer from "./product/productSlice";
import roleReducer from "./role/roleSlice";
import surveyReducer from "./survey/surveySlice";
import categoryReducer from "./category/categorySlice";
import orderReducer from "./order/orderSlice";
import revenueReducer from "./revenue/revenueSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    users: userReducer,
    collaborators: collaboratorReducer,
    products: productReducer,
    roles: roleReducer,
    surveys: surveyReducer,
    categories: categoryReducer,
    orders: orderReducer,
    revenue: revenueReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
