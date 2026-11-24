import type { ReactNode } from "react";

export type ExpandableContentProps = {
  children: ReactNode;
  /** How tall the content may be, in rem, before it is cut off with a Show more toggle. */
  collapsedHeightRem?: number;
  /** Styles the outer box, which also holds the toggle. */
  className?: string;
};
