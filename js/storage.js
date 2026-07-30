const DataStore = (() => {
  const KEY = 'scoreskor_data';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data && Array.isArray(data.players)) {
        data.players = data.players.map(p => ({
          name: String(p.name || ''),
          score: Number(p.score) || 0
        }));
        return data;
      }
      return null;
    } catch {
      return null;
    }
  }

  function save(players) {
    const data = {
      players: players.map(p => ({ name: p.name, score: p.score })),
      _t: Date.now()
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function clear() {
    localStorage.removeItem(KEY);
  }

  function hasData() {
    return localStorage.getItem(KEY) !== null;
  }

  return { load, save, clear, hasData, KEY };
})();