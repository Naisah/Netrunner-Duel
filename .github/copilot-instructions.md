# Project Instructions

## Project overview

Build **Netrunner Duel**, a cyberpunk-themed app based on Mona Mayhem that compares two GitHub users' contribution graphs. The current app is a minimal Astro scaffold; treat the application code and the requirements in the active task as the source of truth. Ignore the workshop materials when implementing the app.

## Stack and commands

- Use Astro with JavaScript or TypeScript, following the language and patterns already used in the touched files.
- Style with Tailwind CSS where it is configured, or Astro component-scoped CSS. Do not assume Tailwind is installed or add dependencies without need.
- Use the existing npm scripts: `npm run dev` for local development, `npm run build` to build, and `npm run preview` to preview a build.
- The project uses Astro server output with the Node.js standalone adapter.

## Implementation guidelines

- Keep components and responsibilities modular; favor clean, readable code over clever abstractions.
- Follow existing file naming conventions and Astro project structure.
- Preserve existing behavior unless a task explicitly calls for a change.
- Prefer Astro components and server/API routes that fit the existing architecture; keep browser-only behavior in client-side scripts.
- Validate changes with the narrowest relevant check, and run `npm run build` for application changes when practical.
