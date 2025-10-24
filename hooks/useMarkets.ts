/**
 * useMarkets Hook
 *
 * Fetches markets from Supabase database (10x faster than blockchain RPC)
 * Uses v_active_markets view for pre-calculated odds and volume
 */

import { useState, useEffect } from "react";
import { supabase, type DbActiveMarket } from "@/lib/supabase";

export interface UseMarketsResult {
  markets: DbActiveMarket[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseMarketsOptions {
  filter?: "all" | "active" | "resolved";
  autoRefresh?: boolean; // Poll for updates every 10 seconds
  refreshInterval?: number; // Milliseconds (default: 10000)
}

/**
 * Fetch markets from Supabase
 *
 * @example
 * ```tsx
 * const { markets, loading, error, refetch } = useMarkets({
 *   filter: "active",
 *   autoRefresh: true
 * });
 * ```
 */
export function useMarkets(options: UseMarketsOptions = {}): UseMarketsResult {
  const {
    filter = "all",
    autoRefresh = false,
    refreshInterval = 10000, // 10 seconds (matches indexer sync)
  } = options;

  const [markets, setMarkets] = useState<DbActiveMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = async () => {
    try {
      setError(null);

      // Use the v_active_markets view for pre-calculated data
      let query = supabase.from("v_active_markets").select("*");

      // Apply filter
      if (filter === "active") {
        query = query.eq("status", "active");
      } else if (filter === "resolved") {
        query = query.eq("status", "resolved");
      }

      // Order by volume (most popular first)
      query = query.order("total_volume", { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw new Error(`Failed to fetch markets: ${fetchError.message}`);
      }

      setMarkets(data || []);
    } catch (err: any) {
      console.error("useMarkets error:", err);
      setError(err.message || "Failed to fetch markets");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchMarkets();
  }, [filter]); // Re-fetch when filter changes

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      fetchMarkets();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, filter]);

  return {
    markets,
    loading,
    error,
    refetch: fetchMarkets,
  };
}

/**
 * Fetch single market by ID
 */
export function useMarket(marketId: string) {
  const [market, setMarket] = useState<DbActiveMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!marketId) {
      setLoading(false);
      return;
    }

    async function fetchMarket() {
      try {
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("v_active_markets")
          .select("*")
          .eq("market_id", marketId)
          .single();

        if (fetchError) {
          throw new Error(`Failed to fetch market: ${fetchError.message}`);
        }

        setMarket(data);
      } catch (err: any) {
        console.error("useMarket error:", err);
        setError(err.message || "Failed to fetch market");
      } finally {
        setLoading(false);
      }
    }

    fetchMarket();
  }, [marketId]);

  return { market, loading, error };
}
