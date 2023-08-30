import { useAuth0 } from "@auth0/auth0-react";
import React from "react";

const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated } = useAuth0();

  const handleLogin = async () => {
    await loginWithRedirect({
      appState: {
        returnTo: "/home",
      },
      authorizationParams: {
        prompt: "login",
      },
    });
  };

  return (
    !isAuthenticated && (
      <button
        className="btn btn-outline-verdedottclaro w-100 d-flex align-items-center"
        onClick={handleLogin}
      >
        Sign in
      </button>
    )
  );
};

export default LoginButton;
