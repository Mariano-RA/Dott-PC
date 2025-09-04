import { handleAuth, handleLogin } from "@auth0/nextjs-auth0";

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      prompt: "login",
      audience: "https://be.dott-pc.com.ar",
      scope: "openid email profile offline_access",
    },
    returnTo: "/",
  }),
  signup: handleLogin({
    authorizationParams: {
      prompt: "login",
      screen_hint: "signup",
    },
    returnTo: "/",
  }),
});
