"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { CurrentUserContext } from "@/components/current-user-provider";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import type { Business } from "@/types/business";
import type { BusinessMembershipRow, BusinessRow, ProfileRow } from "@/types/live/rows";
import type { TeamMember } from "@/types/team";

type LiveCurrentUserProviderProps = {
  children: ReactNode;
};

type LiveUserLoadState =
  | { status: "loading" }
  | { status: "not-configured" }
  | { status: "signed-out" }
  | { status: "error"; message: string }
  | {
      status: "ready";
      signedInUserId: string;
      profiles: ProfileRow[];
      memberships: BusinessMembershipRow[];
      businesses: BusinessRow[];
    };

function LiveStatusMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="flex max-w-md flex-col gap-3 rounded-lg border bg-card p-6 text-sm">
        <h1 className="font-heading text-lg font-semibold">{title}</h1>
        {children}
      </div>
    </main>
  );
}

/**
 * Live mode: the signed-in Supabase user, their businesses and their teammates (E4-2, E4-3).
 * RLS decides what comes back, so this only shows people who share a business with the user.
 * "View as" is off here: the database authorizes by the real session.
 */
export default function LiveCurrentUserProvider({ children }: LiveCurrentUserProviderProps) {
  const router = useRouter();

  const [loadState, setLoadState] = useState<LiveUserLoadState>({ status: "loading" });
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  const contextValue = useMemo(() => {
    if (loadState.status !== "ready") {
      return null;
    }

    const businesses: Business[] = loadState.businesses.map((businessRow) => ({
      id: businessRow.id,
      name: businessRow.name,
      shortName: businessRow.short_name,
    }));
    const signedInMemberships = loadState.memberships.filter(
      (membership) => membership.user_id === loadState.signedInUserId,
    );
    const availableBusinesses = businesses.filter((business) =>
      signedInMemberships.some((membership) => membership.business_id === business.id),
    );
    const currentBusiness =
      availableBusinesses.find((business) => business.id === selectedBusinessId) ??
      availableBusinesses[0];

    if (!currentBusiness) {
      return null;
    }

    // A person's role is per business, so TeamMember.role is their role in the current one.
    const teamMembers: TeamMember[] = loadState.profiles
      .map((profile) => {
        const profileMemberships = loadState.memberships.filter(
          (membership) => membership.user_id === profile.id,
        );
        const currentMembership = profileMemberships.find(
          (membership) => membership.business_id === currentBusiness.id,
        );
        return {
          id: profile.id,
          name: profile.full_name,
          jobTitle: profile.job_title,
          mentionHandle: profile.mention_handle,
          role: currentMembership?.role ?? "member",
          businessIds: profileMemberships.map((membership) => membership.business_id),
        };
      })
      .sort((first, second) => first.name.localeCompare(second.name));
    const signedInUser = teamMembers.find(
      (teamMember) => teamMember.id === loadState.signedInUserId,
    );

    if (!signedInUser) {
      return null;
    }

    return {
      teamMembers,
      signedInUser,
      currentUser: signedInUser,
      isSimulatingUser: false,
      simulateUser: () => undefined,
      availableBusinesses,
      currentBusiness,
      selectBusiness: setSelectedBusinessId,
    };
  }, [loadState, selectedBusinessId]);

  async function handleClickSignOut() {
    await getSupabaseBrowserClient()?.auth.signOut();
    router.replace("/login");
  }

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    let isCancelled = false;

    async function loadSignedInUser() {
      if (!supabase) {
        setLoadState({ status: "not-configured" });
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoadState({ status: "signed-out" });
        router.replace("/login");
        return;
      }

      const [profilesResult, membershipsResult, businessesResult] = await Promise.all([
        supabase.from("profiles").select("id, full_name, mention_handle, job_title, email"),
        supabase.from("business_memberships").select("business_id, user_id, role"),
        supabase.from("businesses").select("id, slug, name, short_name").order("name"),
      ]);
      const loadError = profilesResult.error ?? membershipsResult.error ?? businessesResult.error;

      if (isCancelled) {
        return;
      }
      if (loadError) {
        setLoadState({ status: "error", message: loadError.message });
        return;
      }

      setLoadState({
        status: "ready",
        signedInUserId: userData.user.id,
        profiles: profilesResult.data as ProfileRow[],
        memberships: membershipsResult.data as BusinessMembershipRow[],
        businesses: businessesResult.data as BusinessRow[],
      });
    }

    void loadSignedInUser();

    const authSubscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/login");
      }
    });

    return () => {
      isCancelled = true;
      authSubscription?.data.subscription.unsubscribe();
    };
  }, [router]);

  if (loadState.status === "not-configured") {
    return (
      <LiveStatusMessage title="Live mode isn't set up">
        <p className="text-muted-foreground">
          Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in
          <code> .env</code> (see <code>.env.example</code>), or switch back to mock mode.
        </p>
      </LiveStatusMessage>
    );
  }

  if (loadState.status === "error") {
    return (
      <LiveStatusMessage title="Couldn't load your account">
        <p className="text-muted-foreground">{loadState.message}</p>
      </LiveStatusMessage>
    );
  }

  if (loadState.status === "ready" && !contextValue) {
    const signedInProfile = loadState.profiles.find(
      (profile) => profile.id === loadState.signedInUserId,
    );
    return (
      <LiveStatusMessage title="You're not in a business yet">
        <p className="text-muted-foreground">
          You&rsquo;re signed in as {signedInProfile?.email ?? signedInProfile?.full_name ?? "a new user"},
          but no business has added you yet. Ask a portal admin to give you access.
        </p>
        <Button variant="outline" className="w-fit" onClick={handleClickSignOut}>
          <LogOut aria-hidden />
          Sign out
        </Button>
      </LiveStatusMessage>
    );
  }

  if (!contextValue) {
    return (
      <main className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        Loading your account…
      </main>
    );
  }

  return <CurrentUserContext.Provider value={contextValue}>{children}</CurrentUserContext.Provider>;
}
