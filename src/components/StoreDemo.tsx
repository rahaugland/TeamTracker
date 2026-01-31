import { useAuth, useTeams, usePlayers, useUI } from '@/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

/**
 * StoreDemo demonstrates Zustand state management
 * Shows how to use typed hooks for different slices
 */
export function StoreDemo() {
  const auth = useAuth();
  const teams = useTeams();
  const players = usePlayers();
  const ui = useUI();

  const [email, setEmail] = useState('coach@example.com');
  const [password, setPassword] = useState('password');
  const [teamName, setTeamName] = useState('');
  const [playerName, setPlayerName] = useState('');

  const handleLogin = async () => {
    await auth.signInWithGoogle();
  };

  const handleAddTeam = () => {
    if (teamName.trim()) {
      teams.addTeam({
        id: Date.now().toString(),
        name: teamName,
        season_id: 's1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setTeamName('');
    }
  };

  const handleAddPlayer = () => {
    if (playerName.trim()) {
      players.addPlayer({
        id: Date.now().toString(),
        name: playerName,
        positions: ['setter'],
        created_by: 'demo',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setPlayerName('');
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold">Zustand State Management</h1>
        <p className="text-muted-foreground">
          Typed hooks for auth, teams, players, and UI state
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Auth State */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication State</CardTitle>
            <CardDescription>Auth slice with typed hooks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!auth.isAuthenticated ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button onClick={handleLogin} className="w-full">
                  Login (Demo)
                </Button>
              </>
            ) : (
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-semibold">User:</span> {auth.user?.name}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Email:</span> {auth.user?.email}
                </p>
                <p className="text-sm">
                  <span className="font-semibold">Role:</span> {auth.user?.role}
                </p>
                <Button onClick={auth.signOut} variant="outline" className="w-full">
                  Logout
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* UI State */}
        <Card>
          <CardHeader>
            <CardTitle>UI State</CardTitle>
            <CardDescription>Theme and preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Theme: {ui.theme}</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={ui.theme === 'light' ? 'default' : 'outline'}
                  onClick={() => ui.setTheme('light')}
                >
                  Light
                </Button>
                <Button
                  size="sm"
                  variant={ui.theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => ui.setTheme('dark')}
                >
                  Dark
                </Button>
                <Button
                  size="sm"
                  variant={ui.theme === 'system' ? 'default' : 'outline'}
                  onClick={() => ui.setTheme('system')}
                >
                  System
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Language: {ui.language}</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={ui.language === 'en' ? 'default' : 'outline'}
                  onClick={() => ui.setLanguage('en')}
                >
                  English
                </Button>
                <Button
                  size="sm"
                  variant={ui.language === 'no' ? 'default' : 'outline'}
                  onClick={() => ui.setLanguage('no')}
                >
                  Norsk
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sidebar: {ui.sidebarOpen ? 'Open' : 'Closed'}</Label>
              <Button onClick={ui.toggleSidebar} variant="outline" className="w-full">
                Toggle Sidebar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Teams State */}
        <Card>
          <CardHeader>
            <CardTitle>Teams State</CardTitle>
            <CardDescription>Team management with CRUD operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Add Team</Label>
              <div className="flex gap-2">
                <Input
                  id="team-name"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Team name"
                />
                <Button onClick={handleAddTeam}>Add</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Teams ({teams.teams.length})</Label>
              <div className="space-y-1 max-h-40 overflow-auto">
                {teams.teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{team.name}</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => teams.setActiveTeam(team.id)}
                      >
                        {teams.activeTeamId === team.id ? 'Active' : 'Select'}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => teams.deleteTeam(team.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players State */}
        <Card>
          <CardHeader>
            <CardTitle>Players State</CardTitle>
            <CardDescription>Player roster management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="player-name">Add Player</Label>
              <div className="flex gap-2">
                <Input
                  id="player-name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Player name"
                />
                <Button onClick={handleAddPlayer}>Add</Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Players ({players.players.length})</Label>
              <div className="space-y-1 max-h-40 overflow-auto">
                {players.players.map((player) => (
                  <div key={player.id} className="flex items-center justify-between p-2 bg-muted rounded">
                    <span className="text-sm">{player.name}</span>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => players.deletePlayer(player.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>State Persistence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              State is persisted to localStorage automatically. Try:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Add teams or players</li>
              <li>Change theme or language</li>
              <li>Refresh the page - your changes will persist</li>
              <li>Check browser devtools Application → Local Storage → teamtracker-storage</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
