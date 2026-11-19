import type { Business } from "@/types/business";

// TODO: Load from the backend; every table carries business_id and RLS enforces isolation (E4-2).
export const MOCK_BUSINESSES: Business[] = [
  { id: "business-nwt", name: "New Work Trucks", shortName: "NWT" },
  { id: "business-verilot", name: "Verilot IM", shortName: "Verilot IM" },
  { id: "business-rwt", name: "RWT", shortName: "RWT" },
];
