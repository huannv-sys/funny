import { useState, useEffect } from "react";

export default function useLiveUpdates() {
  const [isLiveEnabled, setIsLiveEnabled] = useState(() => {
    const savedPreference = localStorage.getItem("liveUpdates");
    return savedPreference !== null ? savedPreference === "true" : true;
  });

  useEffect(() => {
    localStorage.setItem("liveUpdates", isLiveEnabled.toString());
  }, [isLiveEnabled]);

  return { isLiveEnabled, setIsLiveEnabled };
}
