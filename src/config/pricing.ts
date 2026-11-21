import type { TranslationKey } from "@/i18n/dictionary";

export type BillingPeriod = "monthly" | "annual";
export type PlanId = "standard" | "plus" | "intensive";

export type Plan = {
  id: PlanId;
  /** Price per month in DZD when billed monthly. */
  monthlyPrice: number;
  /** Price per year in DZD when billed annually (12 months minus 2 free). */
  annualPrice: number;
  highlighted?: boolean;
  /** Plan this one builds on ("Everything in X, and:"). */
  extendsPlan?: PlanId;
  nameKey: TranslationKey;
  descriptionKey: TranslationKey;
  featureKeys: TranslationKey[];
};

export const PLANS: Plan[] = [
  {
    id: "standard",
    monthlyPrice: 20_000,
    annualPrice: 200_000,
    nameKey: "billing.plan.standard.name",
    descriptionKey: "billing.plan.standard.description",
    featureKeys: [
      "billing.plan.standard.f1",
      "billing.plan.standard.f2",
      "billing.plan.standard.f3",
      "billing.plan.standard.f4",
      "billing.plan.standard.f5",
      "billing.plan.standard.f6",
      "billing.plan.standard.f7",
      "billing.plan.standard.f8",
      "billing.plan.standard.f9",
      "billing.plan.standard.f10",
    ],
  },
  {
    id: "plus",
    monthlyPrice: 40_000,
    annualPrice: 400_000,
    highlighted: true,
    extendsPlan: "standard",
    nameKey: "billing.plan.plus.name",
    descriptionKey: "billing.plan.plus.description",
    featureKeys: [
      "billing.plan.plus.f1",
      "billing.plan.plus.f2",
      "billing.plan.plus.f3",
      "billing.plan.plus.f4",
      "billing.plan.plus.f5",
    ],
  },
  {
    id: "intensive",
    monthlyPrice: 90_000,
    annualPrice: 900_000,
    extendsPlan: "plus",
    nameKey: "billing.plan.intensive.name",
    descriptionKey: "billing.plan.intensive.description",
    featureKeys: [
      "billing.plan.intensive.f1",
      "billing.plan.intensive.f2",
      "billing.plan.intensive.f3",
      "billing.plan.intensive.f4",
      "billing.plan.intensive.f5",
    ],
  },
];
