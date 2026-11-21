import { describe, expect, it } from "vitest";

import { DICTIONARY, translate } from "@/i18n/dictionary";

describe("language dictionary", () => {
  it("French has a translation for every English string", () => {
    const missing = Object.keys(DICTIONARY.en).filter((k) => !DICTIONARY.fr[k as keyof typeof DICTIONARY.en]);
    expect(missing).toEqual([]);
  });
  it("fills in placeholders", () => {
    expect(translate("fr", "account.requiredInputs", { department: "Ventes" })).toBe("Données requises pour Ventes");
  });
});
