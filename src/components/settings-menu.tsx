"use client";

import { Settings, X } from "@deemlol/next-icons";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { apiPath } from "@/lib/base-path";

type Board = { id: string; name: string };
type List = { id: string; name: string };
type Selection = {
  boardId: string;
  boardName: string;
  listId: string;
  listName: string;
} | null;
type User = { id: string; username: string } | null;
type UptimeKumaConfig = { baseUrl: string; slug: string } | null;
type NtfySubscription = { id: string; serverUrl: string; topic: string; hasToken: boolean };

const DEFAULT_NTFY_SERVER = "https://ntfy.sh";

declare global {
  interface Window {
    Trello?: {
      authorize: (options: {
        type: "popup";
        name: string;
        scope: { read: boolean; write: boolean };
        expiration: "never" | "1day" | "30days";
        success: () => void;
        error: () => void;
      }) => void;
      token: () => string | undefined;
    };
  }
}

function AuthPanel({ onAuthenticated }: { onAuthenticated: (user: User) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch(apiPath(`/api/auth/${mode}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setBusy(false);
      return;
    }

    onAuthenticated(data.user);
    setBusy(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-2">
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
        className="rounded-md bg-foreground/10 px-2 py-1.5 text-sm text-foreground"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete={mode === "login" ? "current-password" : "new-password"}
        className="rounded-md bg-foreground/10 px-2 py-1.5 text-sm text-foreground"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={busy || !username || !password}
        className="rounded-md bg-foreground/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/20 disabled:opacity-50"
      >
        {mode === "login" ? "Log in" : "Sign up"}
      </button>
      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="text-xs text-muted hover:text-foreground"
      >
        {mode === "login" ? "Need an account? Sign up" : "Have an account? Log in"}
      </button>
    </form>
  );
}

function UptimeKumaPanel() {
  const [config, setConfig] = useState<UptimeKumaConfig>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(apiPath("/api/uptime-kuma/status"))
      .then((res) => res.json())
      .then((data: { config: UptimeKumaConfig }) => setConfig(data.config))
      .catch(() => {});
  }, []);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch(apiPath("/api/uptime-kuma/connect"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl, slug }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setBusy(false);
      return;
    }

    setConfig(data.config);
    setBusy(false);
  }

  async function handleDisconnect() {
    setBusy(true);
    await fetch(apiPath("/api/uptime-kuma/disconnect"), { method: "POST" });
    setConfig(null);
    setBaseUrl("");
    setSlug("");
    setBusy(false);
  }

  return (
    <>
      <h2 className="mt-4 text-sm font-semibold">Uptime Kuma</h2>

      {config ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="break-all text-xs text-muted">
            {config.baseUrl}/status/{config.slug}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleDisconnect}
            className="w-full rounded-md px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>
      ) : (
        <form onSubmit={handleConnect} className="mt-3 flex flex-col gap-2">
          <input
            type="url"
            placeholder="https://uptime.example.com"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="rounded-md bg-foreground/10 px-2 py-1.5 text-sm text-foreground"
          />
          <input
            type="text"
            placeholder="Status page slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="rounded-md bg-foreground/10 px-2 py-1.5 text-sm text-foreground"
          />
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={busy || !baseUrl || !slug}
            className="rounded-md bg-foreground/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/20 disabled:opacity-50"
          >
            Connect Uptime Kuma
          </button>
        </form>
      )}
    </>
  );
}

function NtfyPanel() {
  const [subscriptions, setSubscriptions] = useState<NtfySubscription[]>([]);
  const [serverUrl, setServerUrl] = useState(DEFAULT_NTFY_SERVER);
  const [topic, setTopic] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch(apiPath("/api/ntfy/subscriptions"))
      .then((res) => res.json())
      .then((data: { subscriptions: NtfySubscription[] }) => setSubscriptions(data.subscriptions))
      .catch(() => {});
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch(apiPath("/api/ntfy/subscriptions"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverUrl, topic, token }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong");
      setBusy(false);
      return;
    }

    setSubscriptions((current) => [...current, data.subscription]);
    setTopic("");
    setToken("");
    setBusy(false);
  }

  async function handleRemove(id: string) {
    setBusy(true);
    await fetch(apiPath(`/api/ntfy/subscriptions/${encodeURIComponent(id)}`), { method: "DELETE" });
    setSubscriptions((current) => current.filter((x) => x.id !== id));
    setBusy(false);
  }

  return (
    <>
      <h2 className="mt-4 text-sm font-semibold">ntfy</h2>

      {subscriptions.length > 0 && (
        <ul className="mt-3 flex flex-col gap-1">
          {subscriptions.map((subscription) => (
            <li
              key={subscription.id}
              className="flex items-center justify-between gap-2 rounded-md bg-foreground/5 px-2 py-1.5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm">{subscription.topic}</p>
                <p className="truncate text-xs text-muted">
                  {subscription.serverUrl}
                  {subscription.hasToken && " (token)"}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => handleRemove(subscription.id)}
                aria-label={`Remove ${subscription.topic}`}
                className="shrink-0 rounded p-1 text-muted transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-3 flex flex-col gap-2">
        <input
          type="url"
          placeholder={DEFAULT_NTFY_SERVER}
          value={serverUrl}
          onChange={(e) => setServerUrl(e.target.value)}
          className="rounded-md bg-foreground/10 px-2 py-1.5 text-sm text-foreground"
        />
        <input
          type="text"
          placeholder="Topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="rounded-md bg-foreground/10 px-2 py-1.5 text-sm text-foreground"
        />
        <input
          type="password"
          placeholder="Access token (optional)"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          autoComplete="off"
          className="rounded-md bg-foreground/10 px-2 py-1.5 text-sm text-foreground"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={busy || !topic}
          className="rounded-md bg-foreground/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/20 disabled:opacity-50"
        >
          Add topic
        </button>
      </form>
    </>
  );
}

export function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [user, setUser] = useState<User>(null);
  const [connected, setConnected] = useState(false);
  const [selection, setSelection] = useState<Selection>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [lists, setLists] = useState<List[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState("");
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetch(apiPath("/api/auth/me"))
      .then((res) => res.json())
      .then((data: { user: User }) => setUser(data.user))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (!open || !user) return;
    fetch(apiPath("/api/trello/status"))
      .then((res) => res.json())
      .then((data: { connected: boolean; selection: Selection }) => {
        setConnected(data.connected);
        setSelection(data.selection);
        if (data.connected) {
          setSelectedBoardId(data.selection?.boardId ?? "");
        }
      })
      .catch(() => {});
  }, [open, user]);

  useEffect(() => {
    if (!open || !connected) return;
    fetch(apiPath("/api/trello/boards"))
      .then((res) => res.json())
      .then((data: { boards?: Board[] }) => setBoards(data.boards ?? []))
      .catch(() => {});
  }, [open, connected]);

  useEffect(() => {
    if (!selectedBoardId) return;
    fetch(apiPath(`/api/trello/lists?boardId=${selectedBoardId}`))
      .then((res) => res.json())
      .then((data: { lists?: List[] }) => setLists(data.lists ?? []))
      .catch(() => {});
  }, [selectedBoardId]);

  async function handleLogout() {
    setBusy(true);
    await fetch(apiPath("/api/auth/logout"), { method: "POST" });
    setUser(null);
    setConnected(false);
    setSelection(null);
    setBoards([]);
    setLists([]);
    setSelectedBoardId("");
    setBusy(false);
  }

  async function handleConnect() {
    if (!scriptReady || !window.Trello) return;
    setBusy(true);
    window.Trello.authorize({
      type: "popup",
      name: "New Tab",
      scope: { read: true, write: false },
      expiration: "never",
      success: async () => {
        const token = window.Trello?.token();
        if (token) {
          await fetch(apiPath("/api/trello/connect"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          });
          setConnected(true);
        }
        setBusy(false);
      },
      error: () => setBusy(false),
    });
  }

  async function handleDisconnect() {
    setBusy(true);
    await fetch(apiPath("/api/trello/disconnect"), { method: "POST" });
    setConnected(false);
    setSelection(null);
    setBoards([]);
    setLists([]);
    setSelectedBoardId("");
    setBusy(false);
  }

  async function handleListChange(listId: string) {
    const board = boards.find((b) => b.id === selectedBoardId);
    const list = lists.find((l) => l.id === listId);
    if (!board || !list) return;

    const nextSelection = {
      boardId: board.id,
      boardName: board.name,
      listId: list.id,
      listName: list.name,
    };

    setSelection(nextSelection);
    await fetch(apiPath("/api/trello/selection"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextSelection),
    });
  }

  const apiKey = process.env.NEXT_PUBLIC_TRELLO_API_KEY;

  return (
    <div className="relative" ref={menuRef}>
      {apiKey && (
        <>
          <Script
            src={`https://code.jquery.com/jquery-4.0.0.slim.min.js`}
            onReady={() => setScriptReady(true)}
          />
          <Script
            src={`https://api.trello.com/1/client.js?key=${apiKey}`}
            onReady={() => setScriptReady(true)}
          />
        </>
      )}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open settings"
        className="flex h-9 w-9 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <Settings />
      </button>

      {open && (
        <div className="card absolute right-0 top-11 z-10 max-h-[calc(100vh-4rem)] w-72 overflow-y-auto shadow-lg">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Account</h2>
            {user && (
              <button
                type="button"
                disabled={busy}
                onClick={handleLogout}
                className="text-xs text-muted hover:text-foreground disabled:opacity-50"
              >
                Log out
              </button>
            )}
          </div>

          {!user ? (
            <AuthPanel onAuthenticated={setUser} />
          ) : (
            <>
              <p className="mt-1 text-xs text-muted">Signed in as {user.username}</p>

              <h2 className="mt-4 text-sm font-semibold">Trello</h2>

              {!connected ? (
                <button
                  type="button"
                  disabled={!scriptReady || busy}
                  onClick={handleConnect}
                  className="mt-3 w-full rounded-md bg-foreground/10 px-3 py-2 text-sm font-medium transition-colors hover:bg-foreground/20 disabled:opacity-50"
                >
                  Connect Trello
                </button>
              ) : (
                <div className="mt-3 flex flex-col gap-3">
                  <label className="flex flex-col gap-1 text-xs text-muted">
                    Board
                    <select
                      value={selectedBoardId}
                      onChange={(e) => setSelectedBoardId(e.target.value)}
                      className="rounded-md bg-foreground/10 px-2 py-1.5 text-sm text-foreground"
                    >
                      <option value="">Select a board…</option>
                      {boards.map((board) => (
                        <option key={board.id} value={board.id}>
                          {board.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-xs text-muted">
                    List
                    <select
                      value={selection?.listId ?? ""}
                      onChange={(e) => handleListChange(e.target.value)}
                      disabled={!selectedBoardId}
                      className="rounded-md bg-foreground/10 px-2 py-1.5 text-sm text-foreground disabled:opacity-50"
                    >
                      <option value="">Select a list…</option>
                      {lists.map((list) => (
                        <option key={list.id} value={list.id}>
                          {list.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleDisconnect}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Disconnect
                  </button>
                </div>
              )}

              <UptimeKumaPanel />
              <NtfyPanel />
            </>
          )}
        </div>
      )}
    </div>
  );
}
