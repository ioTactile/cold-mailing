import { type ChangeEvent, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { useGoogleMaps } from "@/hooks/use-google-maps";

export interface CoordsInputValue {
  label: string;
  lat: number | null;
  lng: number | null;
}

interface CoordsInputProps {
  id: string;
  onLocationChange: (value: CoordsInputValue) => void;
  placeholder?: string;
}

function CoordsInput({ id, onLocationChange, placeholder }: CoordsInputProps) {
  const [searchInput, setSearchInput] = useState<string>("");
  const timeoutRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { geocode } = useGoogleMaps();

  useEffect(() => {
    const query = searchInput.trim();

    if (!query) {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      onLocationChange({ label: "", lat: null, lng: null });
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    const controller = new AbortController();
    abortRef.current = controller;

    timeoutRef.current = window.setTimeout(async () => {
      const coords = await geocode(query, {
        country: "FR",
        signal: controller.signal,
      });

      if (coords) {
        onLocationChange({
          label: query,
          lat: coords.lat,
          lng: coords.lng,
        });
      }
    }, 600);

    return () => {
      controller.abort();
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [geocode, onLocationChange, searchInput]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value || "");
  };

  return (
    <Input
      id={id}
      type="text"
      placeholder={placeholder}
      value={searchInput}
      onChange={handleInputChange}
    />
  );
}

export { CoordsInput };
