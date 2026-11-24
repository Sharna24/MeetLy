import { FormEvent, useEffect, useState } from 'react';
import { api, errorMessage } from '../services/api';

interface FriendUser {
  id: string;
  name: string | null;
  department: string | null;
  avatarUrl: string | null;
  bio?: string | null;
}

interface FriendItem {
  friendshipId: string;
  user: FriendUser;
}

interface FriendRequest {
  requestId: string;
  user: FriendUser;
}

export default function Friend() {
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FriendUser[]>([]);
  const [error, setError] = useState('');
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busyAction, setBusyAction] = useState('');

  useEffect(() => {
    void loadConnections();
  }, []);

  async function loadConnections() {
    setLoadingConnections(true);
    try {
      const [friendResponse, incomingResponse, outgoingResponse] = await Promise.all([
        api.get<FriendItem[]>('/friends'),
        api.get<FriendRequest[]>('/friends/requests/incoming'),
        api.get<FriendRequest[]>('/friends/requests/outgoing'),
      ]);
      setFriends(friendResponse.data);
      setIncoming(incomingResponse.data);
      setOutgoing(outgoingResponse.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your friends and requests'));
    } finally {
      setLoadingConnections(false);
    }
  }

  async function searchUsers(e: FormEvent) {
    e.preventDefault();
    const term = query.trim();
    setError('');
    setResults([]);
    if (term.length < 2) {
      setError('Enter at least 2 characters to search.');
      return;
    }

    setSearching(true);
    try {
      const response = await api.get<FriendUser[]>('/users/search', { params: { q: term } });
      setResults(response.data);
    } catch (err) {
      setError(errorMessage(err, 'Could not search for users'));
    } finally {
      setSearching(false);
    }
  }

  async function sendRequest(userId: string) {
    setBusyAction(`send-${userId}`);
    setError('');
    try {
      await api.post('/friends/requests', { receiverId: userId });
      await loadConnections();
    } catch (err) {
      setError(errorMessage(err, 'Could not send friend request'));
    } finally {
      setBusyAction('');
    }
  }

  async function acceptRequest(requestId: string) {
    setBusyAction(`accept-${requestId}`);
    setError('');
    try {
      await api.patch(`/friends/requests/${encodeURIComponent(requestId)}/accept`);
      await loadConnections();
    } catch (err) {
      setError(errorMessage(err, 'Could not accept friend request'));
    } finally {
      setBusyAction('');
    }
  }

  function requestStatus(userId: string) {
    if (friends.some((friend) => friend.user.id === userId)) return 'Already friends';
    if (outgoing.some((request) => request.user.id === userId)) return 'Request sent';
    if (incoming.some((request) => request.user.id === userId)) return 'Request received';
    return null;
  }

  function renderUser(user: FriendUser) {
    return (
      <>
        {user.avatarUrl && <img className="avatar" src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />}
        <div className="friend-details">
          <strong>{user.name || 'Meetly user'}</strong>
          <div className="muted small">{user.department || 'Department not provided'}</div>
        </div>
      </>
    );
  }

  return (
    <div className="panel">
      <h1>Friends</h1>

      <section className="friend-section">
        <h2>Find people</h2>
        <form className="friend-search" onSubmit={searchUsers}>
          <label htmlFor="friend-search">Search by name or student ID</label>
          <div className="friend-search-row">
            <input
              id="friend-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a name or student ID"
            />
            <button type="submit" disabled={searching}>{searching ? 'Searching…' : 'Search'}</button>
          </div>
        </form>

        {results.length > 0 && (
          <div className="friend-list">
            {results.map((user) => {
              const status = requestStatus(user.id);
              return (
                <article className="friend-item" key={user.id}>
                  <div className="row">{renderUser(user)}</div>
                  {status ? (
                    <span className="muted small">{status}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void sendRequest(user.id)}
                      disabled={busyAction !== ''}
                    >
                      {busyAction === `send-${user.id}` ? 'Sending…' : 'Add friend'}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}
        {!searching && query.trim().length >= 2 && results.length === 0 && !error && (
          <p className="muted small">No people found.</p>
        )}
      </section>

      {error && <p className="error">{error}</p>}

      <section className="friend-section">
        <h2>Friend requests</h2>
        {loadingConnections ? (
          <p className="muted small">Loading requests…</p>
        ) : incoming.length === 0 ? (
          <p className="muted small">No incoming friend requests.</p>
        ) : (
          <div className="friend-list">
            {incoming.map((request) => (
              <article className="friend-item" key={request.requestId}>
                <div className="row">{renderUser(request.user)}</div>
                <button
                  type="button"
                  onClick={() => void acceptRequest(request.requestId)}
                  disabled={busyAction !== ''}
                >
                  {busyAction === `accept-${request.requestId}` ? 'Accepting…' : 'Accept'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="friend-section">
        <h2>Your friends</h2>
        {loadingConnections ? (
          <p className="muted small">Loading friends…</p>
        ) : friends.length === 0 ? (
          <p className="muted small">You have not added any friends yet.</p>
        ) : (
          <div className="friend-list">
            {friends.map((friend) => (
              <article className="friend-item" key={friend.friendshipId}>
                <div className="row">{renderUser(friend.user)}</div>
              </article>
            ))}
          </div>
        )}
      </section>

      {outgoing.length > 0 && (
        <section className="friend-section">
          <h2>Sent requests</h2>
          <div className="friend-list">
            {outgoing.map((request) => (
              <article className="friend-item" key={request.requestId}>
                <div className="row">{renderUser(request.user)}</div>
                <span className="muted small">Pending</span>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}