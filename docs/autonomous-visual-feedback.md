# ChatGPT image feedback (experimental)

Companion ChatCMD branch: `implementation/autonomous-visual-feedback`.

The browser extension and desktop extension provider copies support native MCP image results when the user enables **Enable ChatGPT image feedback** in the extension controls. The preference is disabled by default. The existing bridge and background image transport are reused. Supported provider attachment MIME types are PNG, JPEG and WebP, with a maximum of four images and 8 MiB each; the companion ChatCMD file reader emits PNG only.

The provider uses one upload-input change event, unique attachment filenames, named preview confirmation, and one send click. Missing or ambiguous confirmation produces an error rather than retrying. A provider limit stops the attempt. Existing manual attachments are checked before editing the composer where detectable. Selectors are conservative and are not yet validated against the live provider. Never assume the model saw a picture based solely on metadata or DOM confirmation.

## Offline checks

Run `node snapgent-extension/test-chatgpt.js` and the other `snapgent-extension/test*.js` scripts. Simulated checks cover default-off, explicit opt-in, repeated distinct images, missing attachment confirmation, ambiguous send confirmation, and provider-limit errors. Syntax checks cover both provider copies and changed JavaScript. These checks do not upload anything to ChatGPT.

## Manual activation and acceptance

Do not reload the running extension or restart the active bridge/server without explicit user approval. Use an isolated test browser profile with the matching ChatCMD build and a single test extension, then explicitly enable image feedback. Confirm the new tool is authorized and visible. Capture a project screenshot, submit it through the tool, and verify the model can identify image-only details. Repeat with distinct randomized blind images and actual First Money Music screenshots. If upload or send confirmation is missing, inspect manually; do not retry automatically. Respect normal provider restrictions and quotas. Disable the feature and return to the previous extension on failure. No main-branch merge or live activation has occurred.
