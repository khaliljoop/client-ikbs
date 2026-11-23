"use client";

import { useEffect } from "react";

export default function LegacyAuthCleanup() {
  useEffect(() => {
    try {
      window.localStorage.removeItem("ikbs_mock_user");
    } catch {
      // The application works when storage is blocked by the browser.
    }
  }, []);
  return null;
}
