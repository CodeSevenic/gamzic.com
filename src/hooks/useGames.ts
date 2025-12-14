'use client';

import { useState, useEffect } from 'react';
import { getGames } from '@/lib/firebase/db';
import { GAMES as DEFAULT_GAMES, type Game } from '@/types';

interface UseGamesOptions {
  activeOnly?: boolean;
}

interface UseGamesReturn {
  games: Game[];
  isLoading: boolean;
  error: Error | null;
  getGameInfo: (gameId: string) => { name: string; icon: string };
  gameOptions: { value: string; label: string }[];
}

export function useGames(options: UseGamesOptions = {}): UseGamesReturn {
  const { activeOnly = true } = options;
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const fetchedGames = await getGames(activeOnly);
        setGames(fetchedGames);
      } catch (err) {
        console.error('Error fetching games:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch games'));
        // Keep games empty - will fall back to defaults
      } finally {
        setIsLoading(false);
      }
    };

    fetchGames();
  }, [activeOnly]);

  // Helper to get game info - checks dynamic games first, then defaults
  const getGameInfo = (gameId: string): { name: string; icon: string } => {
    const dynamicGame = games.find((g) => g.id === gameId);
    if (dynamicGame) {
      return { name: dynamicGame.name, icon: dynamicGame.icon };
    }
    const defaultGame = DEFAULT_GAMES.find((g) => g.id === gameId);
    if (defaultGame) {
      return { name: defaultGame.name, icon: defaultGame.icon };
    }
    return { name: gameId, icon: '🎮' };
  };

  // Generate options for Select components
  const gameOptions = games.length > 0
    ? games.map((g) => ({ value: g.id, label: `${g.icon} ${g.name}` }))
    : DEFAULT_GAMES.map((g) => ({ value: g.id, label: `${g.icon} ${g.name}` }));

  return {
    games,
    isLoading,
    error,
    getGameInfo,
    gameOptions,
  };
}

