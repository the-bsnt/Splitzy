import React from "react";
import logoImage from "../assets/splitzy.svg";
function Logo() {
  return (
    <header>
      <img
        src={logoImage}
        alt="Company Logo"
        className="w-full h-auto max-w-full"
      />
    </header>
  );
}
export default Logo;
