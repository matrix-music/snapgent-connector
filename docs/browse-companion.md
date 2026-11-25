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

Automated tests exercise both Snapgent bundles with Browse off and on, discovery, prefix collisions, consecutive per-server routing, unrelated-server refusals, revocation, navigation, a safe retry, and native image results. The existing JavaScript and Python suites also pass. A loopback smoke test loaded both real MCP catalogs, routed a qualified request to the installed Browse process and rejected that request under the ChatCMD server ID. The isolated Chrome build uses a separate unpacked extension ID and a different loopback bridge port. Live acceptance is pending isolated activation and an authenticated Testing tab.

## Rollback

Use **Disable Browse** to revoke the current conversation’s grant. Remove only the `browse` bridge entry and reload the bridge configuration to remove Browse from Snapgent’s catalog. Keep the existing Browse extension and relay installed for other clients. To roll back the Snapgent source, use the previous verified build at `4129054`. For an isolated test installation, remove its unpacked extension and stop its test bridge and ChatCMD server. The normal Snapgent checkout, settings and ChatCMD database are separate.
