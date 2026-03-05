"use client";
import { useUser } from "@auth0/nextjs-auth0/client";
import React from "react";
import User from "./User";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const Login = () => {
  const { user } = useUser();
  const isLocalAuthBypass = process.env.NEXT_PUBLIC_LOCAL_DEV_AUTH_BYPASS === "true";

  if (isLocalAuthBypass) {
    return (
      <div className="flex items-center ms-2">
        <a
          type="button"
          className="relative rounded-full bg-red-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-800 cursor-pointer"
          href="/admin"
        >
          <span className="absolute -inset-1.5" />
          <span className="sr-only">Admin local</span>
          <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
        </a>
      </div>
    );
  }

  return (
    <div className="flex items-center ms-2">
      {user ? (
        <div className="text-white">
          <User />
        </div>
      ) : (
        <a
          type="button"
          className="relative rounded-full bg-red-800 p-1 text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-red-800 cursor-pointer"
          href="/api/auth/login"
        >
          <span className="absolute -inset-1.5" />
          <span className="sr-only">Login</span>
          <ArrowRightOnRectangleIcon className="h-6 w-6" aria-hidden="true" />
        </a>
      )}
    </div>
  );
};

export default Login;
