# OpenCode Browse companion

Snapgent can expose Browse alongside the ChatCMD target in a ChatGPT conversation. The user selects **Enable Browse** in Snapgent’s **Switch AI and options** menu after the ChatCMD session starts, then asks ChatGPT to use Browse. The grant is scoped to that conversation in the current document. It starts off, and a full reload requires a new grant. **Disable Browse** revokes it. Disabling either server in MCP settings revokes the grant as well.

Register the existing Browse process under the exact server ID `browse` in the Snapgent bridge’s local `config.json`. Keep the existing ChatCMD entry and connection credentials. The example below uses the Browse path on this Mac.

```json
"browse": {
  "command": "/Users/miguelp/.local/bin/browse",
  "args": ["mcp"]
}
```

Start or reload the bridge configuration at an appropriate time. Browse uses the existing local relay and Chrome pairing. A Chrome tab you already have open still needs to be lent through Browse. Continue to use ChatCMD’s own workspace, tool and conversation approvals. The companion adds no Chrome extension permissions and uses the existing Browse authorization scope. Browse can see tabs available to its relay, so only lend the tabs needed for the task.

## Tool routing

- `list_mcp_servers` shows ChatCMD and the approved Browse companion. `list_commands` defaults to ChatCMD.
- `list_commands` with `{"server":"browse"}` lists qualified Browse names such as `browse/execute`. A bare name is still resolved in the selected target’s catalog.
- Calls to other servers are refused. The extension sends the actual server ID for each call, and the bridge continues to check ownership.
- A Browse call already sent to the relay may finish after revocation. Snapgent stops awaiting it and discards its result if unpublished. Revocation cannot undo a completed browser action.
- Inline MCP images follow the existing Snapgent image path. Enable **ChatGPT image feedback** separately when authorized to send those images. A filename alone is text feedback. Browse’s documented screenshot operation can return a native image when no output path is supplied.
- The normal Snapgent tool timeout applies, including to a Browse call awaiting a manual handoff.

## Verification

Automated tests exercise both Snapgent bundles with Browse off and on, discovery, prefix collisions, consecutive per-server routing, unrelated-server refusals, revocation, navigation, a safe retry, native image results, and reminder deferral. All JavaScript suites and 18 Python tests passed. The isolated bridge refused a Browse command sent under the ChatCMD server ID, and ChatCMD refused a command outside its test agent’s tool allowlist.

On November 25, 2026, the existing authenticated Testing tab used a separate unpacked extension ID, a URL-scoped content script, and an isolated loopback bridge and ChatCMD database. Four repeat trials passed.

- Two Browse-disabled trials each completed six consecutive calls. Discovery showed only ChatCMD. Both approved ChatCMD PNGs appeared as conversation attachments, and ChatGPT identified all their blind color and shape pairs in order.
- Two Browse-enabled trials each completed eight consecutive calls while ChatCMD stayed selected. ChatGPT discovered both servers, navigated to a synthetic fixture and read its title through Browse, then correctly described both the Browse screenshot and the ChatCMD PNG. Each image was confirmed on a submitted conversation turn.
- After revocation, a Browse call was refused and discovery showed only ChatCMD. The four repeat trials and the revocation check had no false empty replies, watchdog restarts, or stalls.

The first mixed trial exposed an exact-caption confirmation failure. ChatGPT rendered the periodic system reminder’s Markdown fences differently when the reminder accompanied an image. The screenshot reached the conversation, but Snapgent timed out on confirmation. The corrected build defers the reminder to the next text-only result. A repeat trace shows two successful image confirmations followed by the reminder on a later text result. The response detection, composer and submission routines were not changed.

The five repeat traces and the reminder-order evidence are stored locally in the companion ChatCMD checkout under `target/live-visual-feedback/browse-companion-2026-11-25/`.

## Rollback

Use **Disable Browse** to revoke the current conversation’s grant. Remove only the `browse` bridge entry and reload the bridge configuration to remove Browse from Snapgent’s catalog. Keep the existing Browse extension and relay installed for other clients. To roll back the Snapgent source, use the previous verified build at `4129054`. Keep the original extension installed during a temporary swap so Chrome retains its settings. For an isolated test installation, remove its unpacked extension and stop its test bridge and ChatCMD server. The normal Snapgent checkout, settings and ChatCMD database are separate.
