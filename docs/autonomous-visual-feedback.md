# ChatGPT image feedback (experimental)

Companion ChatCMD branch: `implementation/autonomous-visual-feedback`.

Select **Enable ChatGPT image feedback** in Snapgent's **Switch AI and options** menu. The browser and desktop extensions keep this setting off by default. The existing MCP bridge transports images. The adapter accepts PNG, JPEG and WebP, with an extension limit of four images of up to 8 MiB each. ChatCMD's `fs_view_image` emits PNG only. ChatGPT applies its own upload, account and model limits.

## Composer correction

The old adapter guessed a hidden file input and required exactly one image-capable candidate when its historical test ID was absent. Live Chrome exposed three eligible inputs in the active form. The visible **Add photos** control chose the general files input, whose test ID was absent. The live transcript also used `data-message-role` and a stable element ID for each turn. That layout escaped the old turn detector even when ChatGPT had rendered a submitted image.

The adapter uses ChatGPT's normal file-drop flow. It types the tool result first, dispatches one drop on the active composer, and waits for each named image to load and for the upload indicator to clear. Chrome showed that the Send button can become enabled during upload. The adapter clicks Send once and looks for each image on a new user turn with a stable ID. An existing manual attachment, a changed draft or composer, cancellation, disabled consent, and upload or confirmation failures stop the attempt. Uncertain submissions require inspection before resuming.

## Diagnostics

Open **Switch AI and options → Image delivery diagnostics** in the tab that ran the tool. The panel shows the latest attempt's stages and image counts, including whether the composer handled the drop, whether previews loaded, and whether a new user turn displayed the images. Image delivery errors also appear in the Snapgent banner. The panel is stored in memory for that tab and omits image payloads, paths, conversation text and credentials.

`image.deliveryConfirmed` records a visible attachment on a new user turn. Use a blind image test to verify model interpretation.

## Verification

- Chrome, Nov. 24, 2026. ChatGPT's **Add photos** menu attached and submitted a randomized PNG. The model returned all three color and shape pairs in the correct order (red diamond, blue triangle, orange circle).
- A separate Chrome composer test sent a distinct PNG via the file-drop event. The composer rendered a preview, the conversation displayed the attachment, and the model returned all three pairs in order (red triangle, green cross, blue diamond). The prompt and filename contained no answers.
- An authenticated, approved `fs_view_image` call returned a byte-for-byte PNG through the separate Python bridge. The test agent rejected a tool outside its allowlist.
- The isolated unpacked extension reached the ChatCMD conversation approval gate and returned the denial normally after the approval window expired. A fresh attempt reached ChatGPT's guest sign-in requirement before sending the fixture request. Google rejected sign-in in the isolated Chrome test window. A signed-in run through autonomous tool dispatch and attachment delivery remains open.
- All five `snapgent-extension/test*.js` scripts and the seven bridge unit tests passed. The browser regressions cover distinct attachment names, waiting for ongoing uploads, protecting manual drafts, cancellation, opt-in, provider errors and refusing to retry ambiguous sends.

Browser captures are in the companion ChatCMD worktree under `target/live-visual-feedback/verification-2026-11-24/`.

## Activation and acceptance

Use an isolated browser profile, one extension, and separate ChatCMD and bridge instances. Confirm that the MCP agent is authorized for `fs_view_image` and approve the conversation and read using ChatCMD's normal controls. Opt in to image feedback and use a synthetic PNG in the authorized test workspace. Ask the model to describe randomized details, compare the answer with the locally retained key, and repeat on a distinct image if the provider permits. Check the project screenshot flow only with consent to send the project screenshots. After a provider limit, sign-in restriction, or uncertain send, inspect the provider's current state before another attempt. Keep the active installation and main branches available for review.
