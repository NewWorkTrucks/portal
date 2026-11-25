import type { OnboardingTourStep } from "@/types/onboarding-tour";

// Bump the version when the tour changes enough that everyone should see it again.
// TODO: Save to the user's profile once accounts exist, so the choice follows them.
export const ONBOARDING_TOUR_STORAGE_KEY = "ffl-onboarding-tour-v1";
export const ONBOARDING_TOUR_DISMISSED_VALUE = "dismissed";

/** E5-2 tour, in order. Steps whose target isn't on the page are skipped. */
export const ONBOARDING_TOUR_STEPS: OnboardingTourStep[] = [
  {
    id: "welcome",
    title: "Welcome to the FFL Operations Portal",
    description:
      "A quick tour of the Kanban board. Use the buttons or the arrow keys to move through it, and Escape to leave.",
  },
  {
    id: "business",
    target: "business",
    title: "Your business",
    description:
      "Cards, people and the audit log are kept separate for each business: NWT, Verilot IM and RWT.",
    side: "bottom",
  },
  {
    id: "profile",
    target: "profile",
    title: "Your role",
    description:
      "Your role decides what you can do. Department heads create and assign cards and review the work they assign. Members work on the cards they're given and submit them for review.",
    side: "bottom",
  },
  {
    id: "stages",
    target: "board-columns",
    title: "The seven stages",
    description:
      "Work moves from Not Started to Working on It, Needs Review and Done. Waiting, Stuck and Deferred are for work that can't move forward yet.",
    side: "top",
  },
  {
    id: "new-task",
    target: "new-task",
    title: "Create a task",
    description:
      "A new task needs only a title and an owner. Add the due date, turnaround and a note now or later.",
    side: "bottom",
  },
  {
    id: "card",
    target: "card",
    title: "Open a card",
    description:
      "Click a card (or press Enter) to see its details, post updates, add files and read its history. Right-click it for quick actions.",
    side: "right",
  },
  {
    id: "move",
    target: "board-columns",
    title: "Move cards between stages",
    description:
      "Drag a card, or press Space and then the arrow keys. Each stage asks for what it needs, like a note for Needs Review or the blocker for Stuck. Type @ in any note to mention someone.",
    side: "top",
  },
  {
    id: "daily-update",
    target: "column-working-on-it",
    title: "Post a daily update",
    description:
      "Cards in Working on It need an update every workday: progress, next steps and any issues. If you couldn't work on it, say why.",
    side: "right",
  },
  {
    id: "review",
    target: "column-needs-review",
    title: "Review requests",
    description:
      "Cards you assigned land here when they're submitted. Approve them with a closing summary, or return them with what needs to change.",
    side: "right",
    roles: ["department_head", "admin"],
  },
  {
    id: "filters",
    target: "filters",
    title: "Find your work",
    description: "Search, or filter by owner, stage, priority and due date.",
    side: "bottom",
  },
  {
    id: "audit-log",
    target: "audit-log",
    title: "Audit log",
    description:
      "Every change, note and mention, with who did it and when. Entries can't be edited or deleted.",
    side: "bottom",
    roles: ["department_head", "admin"],
  },
  {
    id: "notifications",
    target: "notifications",
    title: "Notifications",
    description:
      "The bell shows when someone @mentions you, or asks you to review a card. Leadership is also told when a card gets Stuck. Click one to open the card.",
    side: "bottom",
  },
  {
    id: "settings",
    target: "settings",
    title: "Settings",
    description:
      "Switch between light and dark mode, pick an accent color, and replay this tour anytime with Take the tour.",
    side: "bottom",
  },
];
