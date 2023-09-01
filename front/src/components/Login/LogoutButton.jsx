import { useAuth0 } from "@auth0/auth0-react";
import React from "react";

export const LogoutButton = () => {
  const { logout } = useAuth0();

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
  };

  return (
    <button
      className="btn btn-outline-dottclaro d-flex align-items-center w-100 justify-content-center mb-1"
      style={{
        height: "20px",
      }}
      onClick={handleLogout}
    >
      Sign out
    </button>
  );
};
