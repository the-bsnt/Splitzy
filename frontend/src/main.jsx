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
// import Signup from "./pages/Signup";
import Signup from "./pages/Signup2";
// import Login from "./pages/Login";
import Login from "./pages/Login2";
import Dashboard from "./pages/Dashboard";
// import AcceptInvitation from "./pages/InvitationAcceptance";
import AcceptInvitation from "./pages/AcceptInvitation";
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route>
      <Route path="" element={<Home />} />
      <Route path="signup" element={<Signup />} />
      <Route path="login" element={<Login />} />
      {/* <Route path="login" element={<Login2 />} /> */}
      <Route path="dashboard" element={<Dashboard />} />
      <Route path="accept-invitation" element={<AcceptInvitation />} />
    </Route>
  )
);
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
