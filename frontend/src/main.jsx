import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import {
  RouterProvider,
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AcceptInvitation from "./pages/AcceptInvitation";
import GroupDashboard from "./pages/GroupDashboard";
import ExpenseDetail from "./pages/ExpenseDetail";
import NotFound from "./pages/NotFound";
import ServerError from "./pages/ServerError";
import GroupTransactionHistoryPage from "./pages/GroupTransactionHistoryPage";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="" element={<Home />} />
      <Route path="signup" element={<Signup />} />
      <Route path="login" element={<Login />} />
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="accept-invitation" element={<AcceptInvitation />} />
      <Route path="group/:groupName" element={<GroupDashboard />} />
      <Route
        path="/group/:groupName/transaction-history"
        element={<GroupTransactionHistoryPage />}
      />
      <Route
        path="group/:groupName/expense/:expenseTitle"
        element={<ExpenseDetail />}
      />
      <Route path="/400" element={<NotFound />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
