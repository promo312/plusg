# CD+G stream, previews and one-sheet spec

## CD+G stream
- R-CDG-1 The encoder shall emit 24-byte packets: command, instruction, 2 parity-Q bytes, 16 data bytes, 4 parity-P bytes. The command byte is 0x09 for graphics packets and 0x00 for padding.
- R-CDG-2 The stream shall run at 300 packets per second, so it is 7200 bytes per second of audio.
- R-CDG-3 The screen shall be 300 x 216 pixels with a 16-color palette and 6 x 12 pixel tiles (50 x 18 grid; 288 x 192 visible area inside a border).
- R-CDG-4 The encoder shall use Load Color Table (low and high), Memory Preset, Border Preset and Tile Block (normal) instructions.
- R-CDG-5 For each cue the encoder shall draw the line's text with tile blocks so that the line is fully drawn at or before the cue time and the previous line is cleared.
- R-CDG-6 The preview shall decode the same bytes that the user downloads as `.cdg`. There is no separate retro renderer.
- R-CDG-7 Property: decoding the encoded cues shows every line at its cue time.
- R-CDG-8 The UI and docs shall call the view an homage and shall not claim compatibility with legacy players beyond the documented packet format.

## Previews and one-sheet
- R-UI-1 The retro preview shall scale the 300 x 216 screen with nearest-neighbour.
- R-UI-2 The modern preview shall use the same cues and highlight the current line.
- R-UI-3 The one-sheet shall include title, artist, writers, duration, total score, five category marks with reasons and measured numbers, and the rubric version.
- R-UI-4 The HTML one-sheet shall be self-contained (inline CSS, no network).
- R-UI-5 The preview clip shall be at most 30 seconds.
- R-UI-6 Layout shall have no horizontal scroll at 360 px width and tap targets of at least 44 px.
- R-UI-7 The UI shall not show a Compact Disc logo or any other third-party mark.
