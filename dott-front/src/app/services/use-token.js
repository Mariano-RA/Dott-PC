"use client";

import axios from "axios";
import { useEffect, useState } from "react";
import useSWR from "swr";

export const useToken = (config) => {
  const [accessToken, setAccessToken] = useState("");

  const fetcher = async (config) => await axios(config).then((res) => res.data);

  const {
    data,
    error,
    isLoading: isApiResponseLoading,
  } = useSWR(config, fetcher);

  useEffect(() => {
    if (isApiResponseLoading) {
      return;
    }

    if (error) {
      setAccessToken(
        error.response && error.response.data
          ? JSON.stringify(error.response.data, null, 2)
          : "No hay token"
      );
    }

    if (data) {
      setAccessToken(JSON.stringify(data, null, 2));
    }
  }, [data, error, isApiResponseLoading]);

  return { accessToken: accessToken };
};
