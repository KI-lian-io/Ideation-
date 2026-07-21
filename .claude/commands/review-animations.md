---
description: Review UI animations and motion with the emil-design-eng lens
---

Invoke the `emil-design-eng` skill, then review the animations, transitions, and
motion in $ARGUMENTS (default: the current git diff; if the diff is empty, the
project's UI files — `.tsx`, `.css`).

Focus only on motion: easing curves, durations, press/hover feedback, enter/exit
states, `transform-origin`, reduced-motion handling, and `scale(0)` pop-ins.
Output the required Before/After/Why markdown table. Flag what to deliberately
skip. End with the two or three highest-leverage fixes.
