"use client";

import { ListChecks, Newspaper, Send } from "lucide-react";
import { useState } from "react";
import { sendGoogleChatTest } from "@/api/google-chat-test";
import { useCurrentUser } from "@/components/current-user-provider";
import { useDataMode } from "@/components/data-mode-provider";
import SettingsRow from "@/components/settings/settings-row";
import SettingsSection from "@/components/settings/settings-section";
import { Button } from "@/components/ui/button";
import type { GoogleChatTestKind, GoogleChatTestResult } from "@/types/google-chat-test";

function describeTestResult(businessName: string, testKind: GoogleChatTestKind, testResult: GoogleChatTestResult) {
  if (!testResult.isQueued) {
    return `${businessName} has no Google Chat webhook set up, so nothing was sent.`;
  }
  if (testKind === "message") {
    return `Test message sent to ${businessName}'s space. If it doesn't arrive, check the webhook URL.`;
  }
  if (testResult.cardCount === 0) {
    return testKind === "digest"
      ? `Preview sent to ${businessName}'s space: no stuck, missed or overdue cards.`
      : `Preview sent to ${businessName}'s space: every Working on It card is up to date.`;
  }
  return `Preview sent to ${businessName}'s space with ${testResult.cardCount} ${testResult.cardCount === 1 ? "card" : "cards"}.`;
}

export default function GoogleChatTestSettingsSection() {
  const { currentUser, currentBusiness } = useCurrentUser();
  const { dataMode } = useDataMode();

  const [runningTestKind, setRunningTestKind] = useState<GoogleChatTestKind | null>(null);
  const [testResultMessage, setTestResultMessage] = useState<string | null>(null);
  const [testErrorMessage, setTestErrorMessage] = useState<string | null>(null);

  if (currentUser.role !== "admin") {
    return null;
  }

  const isLiveMode = dataMode === "live";
  const areTestsDisabled = !isLiveMode || runningTestKind !== null;

  async function handleClickRunTest(testKind: GoogleChatTestKind) {
    setRunningTestKind(testKind);
    setTestResultMessage(null);
    setTestErrorMessage(null);
    try {
      const testResult = await sendGoogleChatTest(currentBusiness.id, testKind);
      setTestResultMessage(describeTestResult(currentBusiness.shortName, testKind, testResult));
    } catch (error) {
      setTestErrorMessage(error instanceof Error ? error.message : "The test couldn't be sent.");
    } finally {
      setRunningTestKind(null);
    }
  }

  return (
    <SettingsSection
      title="Google Chat test"
      description={`Admins only. Posts a message labeled TEST to ${currentBusiness.shortName}'s space. Cards, activity and notifications don't change.`}
    >
      <SettingsRow
        controlId="settings-chat-test-message"
        label="Connection"
        description="Checks that this business's space receives messages."
      >
        <Button
          id="settings-chat-test-message"
          variant="outline"
          disabled={areTestsDisabled}
          onClick={() => handleClickRunTest("message")}
        >
          <Send aria-hidden />
          {runningTestKind === "message" ? "Sending…" : "Send test message"}
        </Button>
      </SettingsRow>

      <SettingsRow
        controlId="settings-chat-test-summary"
        label="6 PM summary"
        description="Posts a preview of the cards with no update so far today."
      >
        <Button
          id="settings-chat-test-summary"
          variant="outline"
          disabled={areTestsDisabled}
          onClick={() => handleClickRunTest("summary")}
        >
          <ListChecks aria-hidden />
          {runningTestKind === "summary" ? "Sending…" : "Send preview"}
        </Button>
      </SettingsRow>

      <SettingsRow
        controlId="settings-chat-test-digest"
        label="Morning digest"
        description="Posts a preview of today's stuck, missed and overdue cards."
      >
        <Button
          id="settings-chat-test-digest"
          variant="outline"
          disabled={areTestsDisabled}
          onClick={() => handleClickRunTest("digest")}
        >
          <Newspaper aria-hidden />
          {runningTestKind === "digest" ? "Sending…" : "Send preview"}
        </Button>
      </SettingsRow>

      {!isLiveMode && <p className="text-sm text-muted-foreground">Switch to Live data to send a test.</p>}
      <p role="status" className="text-sm text-muted-foreground empty:hidden">
        {testResultMessage}
      </p>
      {testErrorMessage && (
        <p role="alert" className="text-sm text-destructive">
          {testErrorMessage}
        </p>
      )}
    </SettingsSection>
  );
}
