# ChatGPT image feedback (experimental)

Companion ChatCMD branch: `implementation/autonomous-visual-feedback`.

Select **Enable ChatGPT image feedback** in Snapgent's **Switch AI and options** menu. The browser and desktop extensions keep this setting off by default. The existing MCP bridge transports images. The adapter accepts PNG, JPEG and WebP, with an extension limit of four images of up to 8 MiB each. ChatCMD's `fs_view_image` emits PNG only. ChatGPT applies its own upload, account and model limits.

## Composer correction

The old adapter guessed a hidden file input and required exactly one image-capable candidate when its historical test ID was absent. Live Chrome exposed three eligible inputs in the active form. The visible **Add photos** control chose the general files input, whose test ID was absent. The live transcript also used `data-message-role` and a stable element ID for each turn. That layout escaped the old turn detector even when ChatGPT had rendered a submitted image.

The adapter uses ChatGPT's normal file-drop flow. It types the tool result first, dispatches one drop on the active composer, and waits for each named image to load and for the upload indicator to clear. Chrome showed that the Send button can become enabled during upload. The adapter clicks Send once and looks for each image on a new user turn with a stable ID. An existing manual attachment, a changed draft or composer, cancellation, disabled consent, and upload or confirmation failures stop the attempt. Uncertain submissions require inspection before resuming.

In the signed-in Chrome layout, ChatGPT can change the filename suffix from PNG or JPEG to WebP. Its composer labels the submit button **Send**, and the transcript can label each image **User attachment**. The adapter recognizes the known WebP conversion by the unchanged generated filename stem. For the generic transcript label, it checks the new user bubble for the exact sent text and the expected count and dimensions of loaded images.

ChatGPT can put the user message and assistant reply in one turn. The overlay hides the injected user message in that layout and leaves the model reply visible.

## Diagnostics

Open **Switch AI and options → Image delivery diagnostics** in the tab that ran the tool. The panel shows the latest attempt's stages and image counts, including whether the composer handled the drop, whether previews loaded, and whether a new user turn displayed the images. Image delivery errors also appear in the Snapgent banner. The panel is stored in memory for that tab and omits image payloads, paths, conversation text and credentials.

`image.deliveryConfirmed` records a visible attachment on a new user turn. Use a blind image test to verify model interpretation.

## Verification

- Chrome, Nov. 24, 2026. ChatGPT's **Add photos** menu attached and submitted a randomized PNG. The model returned all three color and shape pairs in the correct order (red diamond, blue triangle, orange circle).
- A separate Chrome composer test sent a distinct PNG via the file-drop event. The composer rendered a preview, the conversation displayed the attachment, and the model returned all three pairs in order (red triangle, green cross, blue diamond). The prompt and filename contained no answers.
- An authenticated, approved `fs_view_image` call returned a byte-for-byte PNG through the separate Python bridge. The test agent rejected a tool outside its allowlist.
- The isolated unpacked extension reached the ChatCMD conversation approval gate and returned the denial normally after the approval window expired. A fresh attempt reached ChatGPT's guest sign-in requirement before sending the fixture request. Google rejected sign-in in the isolated Chrome test window. The later signed-in verification used the existing Chrome Testing tab.
- All five `snapgent-extension/test*.js` scripts and the seven bridge unit tests passed. The browser regressions cover distinct attachment names, waiting for ongoing uploads, protecting manual drafts, cancellation, opt-in, provider errors and refusing to retry ambiguous sends.

Browser captures are in the companion ChatCMD worktree under `target/live-visual-feedback/verification-2026-11-24/`.

## Authenticated Chrome verification

OpenCode Browse was used on the lent Testing tab. The initial correction uploaded a PNG and stopped before Send because the preview was labeled WebP. The attached draft was submitted once through the visible Send control. The model read all three randomized objects. A second distinct synthetic PNG traversed the isolated ChatCMD and Python bridge. The updated provider dispatched one drop, confirmed the loaded draft, sent once, and confirmed a new transcript attachment. The model reported all three color and shape pairs correctly. This run exercised the provider in the live browser while the installed Snapgent extension still held its earlier code.

The installed extension was then reloaded from this checkout. A fresh signed-in conversation in the lent Testing tab started Snapgent. The model requested `fs_view_image`, ChatCMD approved the exact scoped PNG through its normal controls, and Snapgent recorded one upload, one send and one confirmed attachment. The model returned the correct blind answer (purple square, green circle, orange triangle), and ChatCMD recorded the task as completed. This run used the ChatCMD executable built from `4516616` on an isolated database and bridge configuration.

A live check found that the old transcript masking hid the final model reply. The same paired-turn CSS now in both extension copies was applied in the test tab. The model reply became visible and the raw injected user message stayed hidden. Reload the extension to pick up the stylesheet for subsequent tabs.

Browser captures and delivery stages are in the ChatCMD worktree under `target/live-visual-feedback/browse-verification-2026-11-24/`.

## Activation and acceptance

Use an isolated browser profile, one extension, and separate ChatCMD and bridge instances. Confirm that the MCP agent is authorized for `fs_view_image` and approve the conversation and read using ChatCMD's normal controls. Opt in to image feedback and use a synthetic PNG in the authorized test workspace. Ask the model to describe randomized details, compare the answer with the locally retained key, and repeat on a distinct image if the provider permits. Check the project screenshot flow only with consent to send the project screenshots. After a provider limit, sign-in restriction, or uncertain send, inspect the provider's current state before another attempt. Keep the active installation and main branches available for review.
