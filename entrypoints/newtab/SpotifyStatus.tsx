import { getAccessToken, login, logout } from "./spotify/auth";

export function SpotifyStatus() {
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadProfile() {
    const token = await getAccessToken();
    if (!token) return setName(null);

    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error(`/me failed: ${response.status}`);

    const profile: { display_name: string } = await response.json();
    setName(profile.display_name);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadProfile().catch((error) => setError(String(error)));
  }, []);

  async function handleLogin() {
    setError(null);
    try {
      await login();
      await loadProfile();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    }
  }

  async function handleLogout() {
    await logout();
    setName(null);
  }

  return (
    <div className="fixed top-4 right-4 flex items-center gap-3 text-sm">
      {name ? (
        <>
          <span>Hi, {name}</span>
          <button onClick={handleLogout} className="underline opacity-70">
            Log out
          </button>
        </>
      ) : (
        <button
          onClick={handleLogin}
          className="rounded-full bg-[#1ed760] px-4 py-2 font-semibold text-black"
        >
          Connect Spotify
        </button>
      )}
      {error && <span className="text-red-300">{error}</span>}
    </div>
  );
}
