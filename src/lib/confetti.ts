const CONFETTI_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#fbbf24", "#f472b6", "#60a5fa"];
const CONFETTI_Z_INDEX = 90;
// How long to wait for the card to show up in the Done column after the move is saved.
const FIND_CARD_TIMEOUT_MS = 1500;
const EDGE_MARGIN = 0.05;

function findCardInDoneColumn(taskId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-tour="column-done"] [data-task-id="${CSS.escape(taskId)}"]`);
}

function waitForCardInDoneColumn(taskId: string): Promise<HTMLElement | null> {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    function checkForCard() {
      const card = findCardInDoneColumn(taskId);
      if (card || performance.now() - startedAt > FIND_CARD_TIMEOUT_MS) {
        resolve(card);
        return;
      }
      requestAnimationFrame(checkForCard);
    }
    checkForCard();
  });
}

/**
 * Bursts confetti from a card once it has landed in the Done column. If the card never shows up
 * there (the save failed), nothing happens. canvas-confetti skips it for people who ask for
 * less motion, and loads only when first needed.
 */
export async function celebrateCardDone(taskId: string) {
  const card = await waitForCardInDoneColumn(taskId);
  if (!card) {
    return;
  }
  const cardBox = card.getBoundingClientRect();
  // Done can sit off screen to the right, so keep the burst inside the window.
  const originX = Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, (cardBox.left + cardBox.width / 2) / window.innerWidth));
  const originY = Math.min(1 - EDGE_MARGIN, Math.max(EDGE_MARGIN, (cardBox.top + cardBox.height / 2) / window.innerHeight));

  const { default: confetti } = await import("canvas-confetti");
  const origin = { x: originX, y: originY };
  const shared = { origin, colors: CONFETTI_COLORS, zIndex: CONFETTI_Z_INDEX, disableForReducedMotion: true };
  void confetti({ ...shared, particleCount: 70, spread: 70, startVelocity: 38, ticks: 170, scalar: 0.9 });
  setTimeout(() => {
    void confetti({ ...shared, particleCount: 40, spread: 110, startVelocity: 26, ticks: 140, scalar: 0.8 });
  }, 150);
}
