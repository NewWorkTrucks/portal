import { redirect } from "next/navigation";
import { DEFAULT_SETTINGS_PATH } from "@/constants/settings-navigation";

export default function SettingsPage() {
  redirect(DEFAULT_SETTINGS_PATH);
}
