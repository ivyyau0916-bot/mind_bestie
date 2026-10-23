<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep persona definitions, tone specification and deterministic mock reply planning in `src/lib/chat-personas.ts`; this lets persona rules be tested without a remote AI service.
- Persist the selected persona with the existing local mood store. Switching must keep old bubbles, apply the new persona prompt immediately, and stamp any still-pending reply with the newly selected persona.
- Detect reply locale from the latest message only in the persona module, and localize mock replies, advice and crisis support together; history may inform topic but must not lock reply language.
