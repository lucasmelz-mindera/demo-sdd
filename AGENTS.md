# AGENTS.md

Tic-tac-toe rooms (v1): a client-only Vite + React + TypeScript app on GitHub Pages where two browsers play over WebRTC (PeerJS). Spec: [#6](https://github.com/lucasmelz-mindera/demo-sdd/issues/6). Map: [#1](https://github.com/lucasmelz-mindera/demo-sdd/issues/1).

## Commands
npm ci                     # install from the lockfile
npm run dev                # local dev server (open two tabs to play)
npm test -- --run          # all Vitest tests, once
npm run lint -- --fix      # ESLint from the Vite template
npm run build              # type-check + production build into dist/ (what CI deploys)

## Project
Game interface:   src/games/types.ts        Registry: src/games/registry.ts
Tic-tac-toe:      src/games/tictactoe/      (logic.ts pure, Board.tsx UI)
Rooms:            src/room/                 (roomId.ts, session.ts host reducer)
Networking:       src/net/                  (peer.ts, heartbeat.ts, protocol.ts, hostStore.ts)
Pages:            src/pages/                (Home.tsx, Room.tsx)
Deploy:           .github/workflows/deploy.yml, base in vite.config.ts

## Conventions
- New games implement `Game<State, Move>` from src/games/types.ts in their own folder under src/games/<gameId>/ and add one entry to src/games/registry.ts. Follow src/games/tictactoe/.
- Room, lobby and networking code is game-agnostic: import games only through the registry and the interface.
- Game logic is pure (no React, no PeerJS) and returns new state; illegal moves return `null`.
- Every message received from PeerJS goes through `parseMessage` in src/net/protocol.ts before use.
- The host is the source of truth: it validates moves and broadcasts `state`; the joiner never computes results.
- Routes use `HashRouter` (`/#/room/:gameId/:roomId`); build any runtime URL from `import.meta.env.BASE_URL`.
- Tests sit next to the module (`*.test.ts`) and cover pure modules only; never import `peerjs` or React in a test.

## Boundaries
ALWAYS     run tests, lint and build before you finish; keep `base: '/demo-sdd/'` in vite.config.ts
ALWAYS     use `peerjs@^1.5.5`, `reliable: true` on connect, and the `demo-sdd-<gameId>-<roomId>` peer ID
ASK FIRST  new dependencies (runtime deps are React, react-router, PeerJS only), changes to the message protocol, the Game interface or deploy.yml
NEVER      commit secrets or dist/; add a backend, storage or accounts; use a game-logic library; enable checkers in v1
