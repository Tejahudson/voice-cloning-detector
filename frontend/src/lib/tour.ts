import { driver } from "driver.js"
import "driver.js/dist/driver.css"

/**
 * Guided walkthrough of the analysis flow. Steps are anchored to
 * `data-tour="…"` hooks in the Analyze page and skip any that aren't
 * on screen yet, so the tour works before and after a clip is analysed.
 */
const STEPS = [
  {
    element: '[data-tour="source"]',
    popover: {
      title: "Bring in audio",
      description:
        "Upload one or more recordings, or switch to the microphone tab and record a take directly in the browser.",
    },
  },
  {
    element: '[data-tour="clips"]',
    popover: {
      title: "Your clips",
      description:
        "Everything you analyse in this session is listed here with its risk score. Select one to inspect it.",
    },
  },
  {
    element: '[data-tour="player"]',
    popover: {
      title: "Live signal",
      description:
        "The waveform renders from the real audio. While analysis runs, per-second risk scores stream in beneath it.",
    },
  },
  {
    element: '[data-tour="verdict"]',
    popover: {
      title: "The verdict",
      description:
        "The trained classifier decides real or cloned, and reports how confident it was in that call.",
    },
  },
  {
    element: '[data-tour="explain"]',
    popover: {
      title: "The reasoning",
      description:
        "Signal forensics behind the result — shown to explain it, never to override the model.",
    },
  },
  {
    element: '[data-tour="analyst"]',
    popover: {
      title: "Ask questions",
      description: "Query the result in plain language. Answers come from this clip's actual data.",
    },
  },
]

export function startTour() {
  const available = STEPS.filter((s) => document.querySelector(s.element))
  if (available.length === 0) return

  driver({
    showProgress: true,
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 8,
    popoverClass: "vg-tour",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    steps: available,
  }).drive()
}
