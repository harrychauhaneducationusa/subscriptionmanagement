/**
 * Manual substitution inventory (product §5.2): curated alternatives per recurring category.
 * Today: in-code seed rows maintained by product/engineering.
 * Later: replace or augment with DB table + admin UI + background jobs / allowlisted importers
 * that upsert the same shape without changing recommendation matching logic.
 */

export type SubstitutionInventorySource = 'manual_catalog'

export type SubstitutionAlternative = {
  /** Stable id for analytics / UI keys */
  id: string
  label: string
  /** Human-readable price band, not a live quote */
  priceBandLabel: string
  /** e.g. "Verify availability in your ZIP or state" */
  regionNote?: string
  disclaimer: string
  source: SubstitutionInventorySource
  /** When ops last reviewed this row (ISO date) */
  lastVerifiedAt: string
  /** Optional educational or provider link */
  moreInfoUrl?: string
}

type InventoryRow = {
  /** Lowercase category strings from recurring items (e.g. streaming, utilities, internet) */
  matchCategories: string[]
  alternatives: SubstitutionAlternative[]
}

const MANUAL_ROWS: InventoryRow[] = [
  {
    matchCategories: ['internet', 'broadband', 'fiber'],
    alternatives: [
      {
        id: 'inv_internet_compare_plans',
        label: 'Compare ISP plans in your area',
        priceBandLabel: 'Often lower tiers for similar speed caps',
        regionNote: 'Pricing varies by address; confirm eligibility before switching.',
        disclaimer:
          'Illustrative catalog entry. SubSense does not guarantee savings or availability; verify with providers.',
        source: 'manual_catalog',
        lastVerifiedAt: '2026-05-15',
      },
      {
        id: 'inv_internet_own_equipment',
        label: 'Use your own modem/router if your ISP allows it',
        priceBandLabel: 'Can reduce monthly rental line-items',
        regionNote: 'Check compatibility lists from your ISP.',
        disclaimer: 'One-time hardware cost may apply; suitability depends on your plan.',
        source: 'manual_catalog',
        lastVerifiedAt: '2026-05-15',
      },
    ],
  },
  {
    matchCategories: ['utilities', 'electricity', 'gas', 'water'],
    alternatives: [
      {
        id: 'inv_utility_supplier_switch',
        label: 'Review supplier / tariff options where switching is legal',
        priceBandLabel: 'Depends on regulated market and contract',
        regionNote: 'Some regions have single suppliers; others allow competitive offers.',
        disclaimer: 'Regulatory context differs by country and state; validate before acting.',
        source: 'manual_catalog',
        lastVerifiedAt: '2026-05-15',
      },
    ],
  },
  {
    matchCategories: ['streaming', 'ott', 'entertainment'],
    alternatives: [
      {
        id: 'inv_streaming_tier_down',
        label: 'Drop to ad-supported or lower resolution tier if usage allows',
        priceBandLabel: 'Typical step-down between paid tiers',
        regionNote: 'Catalogs differ by country.',
        disclaimer: 'Savings depend on current plan and household usage.',
        source: 'manual_catalog',
        lastVerifiedAt: '2026-05-15',
      },
      {
        id: 'inv_streaming_rotate',
        label: 'Rotate one service per quarter instead of stacking overlapping catalogs',
        priceBandLabel: 'Reduces parallel subscriptions',
        disclaimer: 'Behavioral change; not a merchant offer.',
        source: 'manual_catalog',
        lastVerifiedAt: '2026-05-15',
      },
    ],
  },
]

function normalizeCategoryKey(category: string) {
  return category.trim().toLowerCase()
}

/**
 * Returns up to `max` curated alternatives for a recurring category, if inventory exists.
 */
export function listAlternativesForCategory(category: string, max = 3): SubstitutionAlternative[] {
  const key = normalizeCategoryKey(category)
  if (!key) {
    return []
  }

  const out: SubstitutionAlternative[] = []
  for (const row of MANUAL_ROWS) {
    if (!row.matchCategories.some((c) => c === key)) {
      continue
    }
    for (const alt of row.alternatives) {
      if (out.length >= max) {
        return out
      }
      out.push(alt)
    }
  }
  return out
}
