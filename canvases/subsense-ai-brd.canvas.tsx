import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type NavKey =
  | "overview"
  | "users"
  | "functional"
  | "platform"
  | "business"
  | "roadmap";

type Requirement = {
  code: string;
  title: string;
  priority: string;
  description: string;
  businessRules: string[];
  workflow: string[];
  edgeCases: string[];
  validations: string[];
  dependencies: string[];
};

const navItems: Array<{ key: NavKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "users", label: "Users + UX" },
  { key: "functional", label: "Functional Scope" },
  { key: "platform", label: "Platform + Risk" },
  { key: "business", label: "Business + Market" },
  { key: "roadmap", label: "Roadmap + Appendix" },
];

const goalsRows = [
  [
    "User acquisition",
    "250k registered users in 18 months, with 30% sourced via partner channels",
    "Builds consumer scale while reducing paid CAC dependency through bank, payroll, and wellness partnerships",
  ],
  [
    "Activation",
    "60% onboarding completion, 45% bank-link rate, 70% first-dashboard activation",
    "The value model depends on users reaching a clear recurring-spend view quickly",
  ],
  [
    "Engagement",
    "50% monthly active rate among activated users and 35% weekly insight interaction",
    "Subscription management is episodic unless reinforced by timely, useful recurring-spend intelligence",
  ],
  [
    "Retention",
    "D30 retention above 40%, premium subscriber churn below 3.5% monthly",
    "The product must become a habitual financial hygiene tool, not a one-time audit utility",
  ],
  [
    "Monetization",
    "4-7% premium conversion by end of year two, positive contribution margin on paid cohorts",
    "Sustainable economics require subscription revenue before marketplace and API revenue mature",
  ],
  [
    "Financial wellness",
    "Average realized annual savings of INR 2,500-6,000 per paying household",
    "Savings outcomes become the core trust and referral engine",
  ],
  [
    "AI insight quality",
    "At least 70% of delivered insights rated useful or very useful",
    "AI must create actionability, not novelty",
  ],
];

const personasRows = [
  [
    "Single professional",
    "Age 25-34, metro city, salaried, uses 6-10 digital subscriptions",
    "Pays via cards and UPI autopay, rarely reviews statement-level recurring spend",
    "Forgotten renewals, multiple streaming/music/cloud plans, low tolerance for setup friction",
    "Wants one-screen visibility and renewal control",
  ],
  [
    "Family finance manager",
    "Age 32-45, married, 3-5 members, mixed income sources",
    "Tracks school, utilities, OTT, broadband, maintenance, insurance and groceries",
    "Household spend sits across spouse cards, bank accounts and app stores",
    "Needs shared visibility, splits, and household optimization",
  ],
  [
    "OTT-heavy user",
    "Age 21-35, entertainment-first, frequent trials and plan swaps",
    "Subscribes to several OTT, gaming, music and creator platforms",
    "Overlaps bundles, forgets trial-to-paid conversions, duplicates family and solo plans",
    "Needs duplicate detection and downgrade prompts",
  ],
  [
    "Budget-conscious planner",
    "Age 24-40, cost-sensitive, tracks monthly budgets manually",
    "Reviews spending regularly but lacks recurring-specific analytics",
    "Utilities and recurring charges erode savings without clear early-warning signals",
    "Needs proactive budget pressure alerts and savings recommendations",
  ],
  [
    "High-income optimizer",
    "Age 30-45, affluent, uses premium financial apps and multiple cards",
    "Has more subscriptions than awareness and values convenience over price",
    "Will pay for a premium service only if insights are trusted, polished and time-saving",
    "Needs concierge-grade intelligence and premium UX",
  ],
  [
    "Student / early-career user",
    "Age 18-24, low disposable income, shares plans with friends/roommates",
    "Uses app-store billing, prepaid recharge, student offers and shared credentials",
    "Small charges accumulate; confusion around split ownership and renewals is common",
    "Needs lightweight manual tracking and affordability nudges",
  ],
];

const functionalRequirements: Requirement[] = [
  {
    code: "A",
    title: "Authentication",
    priority: "MVP Core",
    description:
      "Support mobile-first account creation with OTP verification, optional email binding, Google/Apple sign-in where applicable, and device-level convenience such as biometric unlock. Onboarding drafts should be captured before full registration to reduce first-session abandonment.",
    businessRules: [
      "Verified mobile number is the primary identity key for India launch; one verified number maps to one base consumer profile.",
      "Users may begin onboarding in guest mode, but persistent dashboard access requires registration and policy acceptance.",
      "Household ownership rights can only be assigned to verified accounts.",
      "Security-sensitive actions such as bank linking, consent revocation, export and delete account require recent re-authentication.",
    ],
    workflow: [
      "User lands on value proposition and starts setup without mandatory sign-in.",
      "The app captures household and recurring-spend draft context locally or in a temporary session.",
      "Authentication is requested at the point of saving progress, linking financial data or inviting household members.",
      "Successful verification creates the profile, restores draft data and routes the user to account linking or dashboard activation.",
    ],
    edgeCases: [
      "OTP expiry, repeated failures, SIM change, or delayed SMS delivery.",
      "User starts onboarding on one device and completes on another.",
      "Duplicate account detection where the same user previously registered through a social provider.",
      "Invitee joins a household before completing their own profile.",
    ],
    validations: [
      "Phone numbers must be country-valid and normalized to E.164 format.",
      "OTP attempts, resend counts and rate limits must be enforced per device and number.",
      "Authentication state must expire on suspicious device or IP changes.",
      "Biometric unlock is optional and never replaces server-side session checks.",
    ],
    dependencies: [
      "OTP provider and authentication service",
      "Consent ledger",
      "Session management",
      "Push notification registration",
    ],
  },
  {
    code: "B",
    title: "Household setup",
    priority: "MVP Core",
    description:
      "Allow users to define the financial unit they want to manage: individual, couple, family or roommate-style household. This determines attribution, analytics and savings recommendations from the first session.",
    businessRules: [
      "A household has one owner, optional admins, and member/viewer roles with granular permissions.",
      "At MVP, each user can actively manage one primary household, while future versions may support multiple households.",
      "Expenses and subscriptions can be marked shared, personal or private-to-owner.",
      "Household invites require explicit acceptance before personal data becomes visible to others.",
    ],
    workflow: [
      "User selects household type and enters display name plus approximate member count.",
      "The product asks who typically pays major bills and subscriptions.",
      "The system seeds shared-versus-personal attribution defaults for later detection and analytics.",
      "Invites can be sent immediately or deferred until after dashboard activation.",
    ],
    edgeCases: [
      "Solo user later converts to a shared household.",
      "Member exits the household but historical analytics must remain reconciled.",
      "Children or dependents do not have direct accounts.",
      "A user refuses invites but still wants shared-plan tracking.",
    ],
    validations: [
      "Household name cannot be blank and must be unique within the owner profile.",
      "Role changes that reduce access must take effect immediately on the next refresh.",
      "Private expenses must never appear in other members' detailed views.",
      "Invite links must expire and be revocable.",
    ],
    dependencies: [
      "Identity service",
      "Permissions service",
      "Notification service",
      "Analytics model for personal vs shared tagging",
    ],
  },
  {
    code: "C",
    title: "Subscription management",
    priority: "MVP Core",
    description:
      "Provide a complete system to view, confirm, edit, categorize, pause, cancel-track and annotate subscriptions across digital services, memberships and recurring app-store charges.",
    businessRules: [
      "A subscription record must support cadence, amount, renewal date, merchant, category, payment source, household owner, source type and status.",
      "Detected subscriptions remain in suggested state until confirmed or dismissed by the user.",
      "Cancellation status inside the product is informational unless a verified partner action is completed externally.",
      "A single merchant may legitimately have multiple active plans if product lines or member ownership differ.",
    ],
    workflow: [
      "Detected or manual item appears in review queue.",
      "User confirms, edits metadata, assigns owner and marks shared versus personal.",
      "The item becomes part of dashboard totals, alerts and optimization logic.",
      "Lifecycle events such as price increase, trial ending, pause, resume or cancel are recorded on the timeline.",
    ],
    edgeCases: [
      "Annual charges, app-store bundles, prepaid memberships, and bundled telecom entitlements.",
      "Free trials converting to paid without a stable history.",
      "Refunds or reversals temporarily mimicking cancellation.",
      "One merchant descriptor mapping to different products across banks.",
    ],
    validations: [
      "Amount must be positive and cadence must be one of supported billing patterns.",
      "Renewal date and billing day cannot conflict with cadence logic.",
      "Manual duplicates should trigger a merge suggestion, not silent overwrite.",
      "Dismissed detections must be explainable and reversible.",
    ],
    dependencies: [
      "Recurring detection engine",
      "Merchant catalog",
      "User preferences",
      "Notification scheduler",
    ],
  },
  {
    code: "D",
    title: "Recurring payment detection",
    priority: "MVP Core",
    description:
      "Identify recurring charges from bank transactions using deterministic cadence logic first, then ML-based confidence scoring and enrichment. The detection engine should recognize both fixed subscriptions and variable recurring obligations such as utilities.",
    businessRules: [
      "Base detection must work without generative AI and should rely on cadence, amount tolerance, merchant similarity and historical frequency.",
      "The platform should distinguish subscription-like fixed recurring charges from variable recurring bills.",
      "Every detected item must carry a confidence score and reason code.",
      "Low-confidence detections should be review-first, never auto-committed to savings actions.",
    ],
    workflow: [
      "Transactions are ingested, normalized and clustered by merchant candidate.",
      "Cadence patterns are computed across rolling windows.",
      "Known merchant signatures raise confidence; variable-bill heuristics classify utilities and essentials separately.",
      "Suggested recurring items enter review queues and update dashboards once confirmed.",
    ],
    edgeCases: [
      "Quarterly, annual or semiannual charges with limited history.",
      "Skipped months, proration, plan upgrades, merchant renaming and statement noise.",
      "Shared household payments from different bank accounts.",
      "Salary-like credits or EMI debits incorrectly appearing recurring but not relevant to subscription management.",
    ],
    validations: [
      "Support amount variance thresholds by category rather than a single global threshold.",
      "Every cluster must retain source transaction lineage for audit and user explanation.",
      "The engine must suppress recurring classification for one-off merchant bursts unless cadence stabilizes.",
      "Detection quality should be benchmarked with precision, recall and false-positive rate.",
    ],
    dependencies: [
      "Transaction ingestion pipeline",
      "Merchant normalization service",
      "Model scoring layer",
      "Analytics warehouse",
    ],
  },
  {
    code: "E",
    title: "Utility management",
    priority: "MVP Core",
    description:
      "Track utilities and recurring household bills such as electricity, water, gas, broadband, postpaid mobile, maintenance and rent-like obligations that are critical to financial planning but not classic subscriptions.",
    businessRules: [
      "Utilities must be managed separately from entertainment or lifestyle subscriptions while still rolling into recurring-spend totals.",
      "Variable monthly amounts should be analyzed for trend, volatility and seasonality.",
      "Manual entry is mandatory because many users will have utilities not easily detectable from transaction descriptions alone.",
      "Due-date reminders must work even when bank transactions are delayed or unavailable.",
    ],
    workflow: [
      "User adds provider, account nickname, due day and expected range.",
      "When bank data exists, the engine attempts matching and auto-updates actual amounts.",
      "Dashboard highlights volatility, missed-payment risk and seasonal spikes.",
      "Users can mark the bill paid, split it, or update provider details.",
    ],
    edgeCases: [
      "Prepaid recharges, irregular billing cycles, multiple meters or multiple locations.",
      "One bank transaction paying several utility accounts together.",
      "Cash or UPI payments with weak descriptors.",
      "Household member pays a bill privately but wants only partial visibility.",
    ],
    validations: [
      "Due dates must support monthly and custom-cycle patterns.",
      "Expected range must prevent negative or nonsensical values.",
      "Provider account identifiers must be masked if shown in shared views.",
      "Outlier values should trigger user review before changing baseline forecasts.",
    ],
    dependencies: [
      "Reminder service",
      "Manual entry module",
      "Recurring detection engine",
      "Household permissions",
    ],
  },
  {
    code: "F",
    title: "AI financial insights",
    priority: "MVP Core",
    description:
      "Deliver user-facing insight narratives that summarize recurring-spend behavior, highlight avoidable waste, detect plan inefficiencies and explain month-over-month changes in plain language.",
    businessRules: [
      "Insights must be grounded in structured product facts, not free-form model speculation.",
      "Every generated insight should reference underlying transactions, subscriptions or trend signals.",
      "Low-confidence or redundant insights must be suppressed.",
      "The user should always be able to dismiss an insight and improve future relevance.",
    ],
    workflow: [
      "Rules engine identifies candidate insight opportunities.",
      "Structured context is assembled from recurring items, thresholds and household patterns.",
      "LLM or compact reasoning model converts the structured payload into concise narrative text.",
      "Insight feed stores output with confidence, category, freshness and interaction outcome.",
    ],
    edgeCases: [
      "Sparse data leading to weak or repetitive narratives.",
      "Conflicting signals where a higher spend is intentional rather than wasteful.",
      "Outdated data after consent expiry or ingestion failure.",
      "Households with private items that cannot be referenced in shared summaries.",
    ],
    validations: [
      "Each insight requires evidence pointers and a user-safe explanation string.",
      "No insight may imply guaranteed savings unless deterministically calculated.",
      "Language must be region-aware and free from regulated financial advice claims.",
      "The system must enforce maximum insight frequency to avoid fatigue.",
    ],
    dependencies: [
      "Rules engine",
      "Analytics warehouse",
      "LLM orchestration layer",
      "Feedback capture",
    ],
  },
  {
    code: "G",
    title: "Alerts and notifications",
    priority: "MVP Core",
    description:
      "Trigger timely alerts for renewals, price changes, duplicate services, failed payments, unusual recurring spend and relevant optimization opportunities across push, email and in-app channels.",
    businessRules: [
      "Critical functional alerts are separate from marketing communications and managed by explicit preference settings.",
      "Alerts must respect quiet hours, timezone and channel consent.",
      "Duplicate or near-duplicate alerts for the same event must be deduplicated.",
      "Notification copy must be short, specific and action-oriented.",
    ],
    workflow: [
      "Platform events flow into a notification rules engine.",
      "User preference checks, suppression logic and channel priority determine delivery path.",
      "Delivered alerts link directly into relevant subscription, insight or dashboard context.",
      "Outcomes such as open, dismiss, snooze and action complete are tracked for tuning.",
    ],
    edgeCases: [
      "Device push unavailable, email bounced or app uninstalled.",
      "Multiple accounts linked to the same household causing repeated event generation.",
      "Bank ingestion lag causing late alerts.",
      "Renewal and price change happening simultaneously for the same plan.",
    ],
    validations: [
      "Every alert type needs a clear trigger definition and expiry window.",
      "Urgent items must still degrade gracefully to in-app inbox if push fails.",
      "Users must be able to snooze without disabling the whole category.",
      "Channels must be auditable for regulatory and customer-support review.",
    ],
    dependencies: [
      "Event bus",
      "Preference center",
      "Notification providers",
      "Analytics instrumentation",
    ],
  },
  {
    code: "H",
    title: "Dashboard analytics",
    priority: "MVP Core",
    description:
      "Present a premium, high-trust dashboard that turns raw recurring spend into decision-ready visibility across totals, categories, trends, renewals, savings opportunities and household views.",
    businessRules: [
      "Dashboard must distinguish detected items, confirmed items and manually entered items.",
      "Refresh timestamp and data-source health must always be visible.",
      "Totals should support monthly-normalized and actual-billed views where annual plans exist.",
      "Personal, shared and household-wide scopes must be filterable.",
    ],
    workflow: [
      "After onboarding or data refresh, the dashboard shows top recurring-spend KPIs.",
      "Widgets expand to detail pages for subscriptions, utilities, trends and insights.",
      "Users can review suggestions, confirm detections and act on savings prompts from the same surface.",
      "Empty and partial states guide the next activation step rather than showing blank analytics.",
    ],
    edgeCases: [
      "No linked bank data, but manual subscriptions exist.",
      "Only utilities detected, with few classic subscriptions.",
      "Annual renewals distorting apparent monthly totals.",
      "Member-level privacy rules restricting household detail rollups.",
    ],
    validations: [
      "Key numbers must reconcile to the visible item list and source transactions.",
      "Charts should preserve readability on small mobile screens.",
      "Dashboard must load a cached last-known state if live aggregation is temporarily delayed.",
      "Filters must be persistent and reversible.",
    ],
    dependencies: [
      "Analytics APIs",
      "Detection engine",
      "Caching layer",
      "Design system",
    ],
  },
  {
    code: "I",
    title: "Bank account aggregation",
    priority: "MVP Core",
    description:
      "Connect user bank accounts through Account Aggregator infrastructure for read-only transaction access, enabling recurring detection, spend analysis and insight generation without requiring manual transaction upload.",
    businessRules: [
      "Consent must be explicit, time-bound, revocable and purpose-specific.",
      "Only read-only access is in scope for MVP; no payment initiation is assumed.",
      "Users must be able to connect multiple accounts and assign them to personal or household scope.",
      "Expired or broken connections should degrade gracefully without losing historical analytics.",
    ],
    workflow: [
      "User chooses bank link flow, selects institution, reviews purpose text and grants consent.",
      "The system receives consent success, account metadata and transaction fetch eligibility.",
      "Transactions are periodically ingested and normalized into the recurring-intelligence pipeline.",
      "If consent expires or bank access fails, the user receives repair prompts while existing data remains visible.",
    ],
    edgeCases: [
      "Bank unsupported by aggregator, partial statement availability or stale fetch windows.",
      "User revokes consent externally from an AA app.",
      "Multiple joint accounts linked by different household members.",
      "Duplicate transactions across overlapping account feeds.",
    ],
    validations: [
      "Consent artifacts must be stored, versioned and linked to every ingestion batch.",
      "Webhook events must be verified and idempotent.",
      "Users must be told exactly when data was last refreshed.",
      "Disconnected accounts must stop further pulls immediately.",
    ],
    dependencies: [
      "Setu AA integration",
      "Consent service",
      "Webhook processor",
      "Transaction normalization pipeline",
    ],
  },
  {
    code: "J",
    title: "Manual subscription entry",
    priority: "MVP Core",
    description:
      "Allow users to create and maintain subscriptions even without bank integration, ensuring the product remains valuable for privacy-sensitive users and for charges not easily discoverable through transactions.",
    businessRules: [
      "Manual items must be clearly labeled by source and remain fully editable.",
      "If later auto-detected, the system should offer merge rather than creating silent duplicates.",
      "Manual entry must support free trial, reminder-only and expected-charge modes.",
      "Manual items participate in alerts, dashboards and savings logic once confirmed.",
    ],
    workflow: [
      "User enters merchant, plan, amount, cadence, renewal date and ownership.",
      "System suggests category and duplicate matches from the merchant catalog.",
      "Item is added immediately to recurring totals and reminder schedules.",
      "When bank data later arrives, a reconciliation flow proposes matching.",
    ],
    edgeCases: [
      "User knows only billing day, not exact renewal date.",
      "Plan amount varies due to taxes or add-ons.",
      "A household member enters the same shared plan twice.",
      "User tracks a future subscription before the first bill occurs.",
    ],
    validations: [
      "Core fields must be complete enough to power reminders.",
      "Unknown merchants must still be allowed with free-text naming.",
      "Date logic must handle leap-year and month-end billing.",
      "Merge suggestions must preserve user notes and history.",
    ],
    dependencies: [
      "Merchant catalog",
      "Reminder engine",
      "Subscription service",
      "Reconciliation logic",
    ],
  },
  {
    code: "K",
    title: "Household comparison analytics",
    priority: "Growth",
    description:
      "Enable comparison of recurring spend across members, categories and benchmark cohorts so users can understand how household behavior differs internally and against anonymized peers.",
    businessRules: [
      "Private expenses cannot be exposed in detailed form to other members without explicit sharing.",
      "Benchmarking must use consented, aggregated and anonymized data only.",
      "Comparisons should focus on recurring-spend efficiency rather than shaming high spend.",
      "Household owner controls whether member-level comparisons are enabled.",
    ],
    workflow: [
      "The dashboard offers filters for household total, member view and benchmark mode.",
      "The system computes category concentration, member contribution and duplicate overlap.",
      "Users see interpretable summaries such as higher-than-expected OTT spend or uneven split burden.",
      "Recommended actions connect directly to shared plan or split settings.",
    ],
    edgeCases: [
      "One member has no linked account and contributes cash or UPI manually.",
      "Households with a dominant payer make direct member comparison misleading.",
      "Privacy settings hide critical data required for fair benchmarking.",
      "Too few comparable households in a cohort can weaken benchmark quality.",
    ],
    validations: [
      "Benchmark cohorts must meet minimum sample thresholds before display.",
      "Member view must mask restricted transactions and notes.",
      "Comparisons must clearly label whether figures are normalized or actual.",
      "Users should be able to turn this feature off entirely.",
    ],
    dependencies: [
      "Household permissions",
      "Benchmarking dataset",
      "Analytics service",
      "Privacy controls",
    ],
  },
  {
    code: "L",
    title: "Savings recommendation engine",
    priority: "MVP Core",
    description:
      "Rank and explain the most realistic recurring-spend savings opportunities, including cancellations, downgrades, consolidations, bundle optimization, annual-versus-monthly plan choices and duplicate removal.",
    businessRules: [
      "Recommendations must be prioritized by realizable value and confidence, not just gross spend.",
      "The engine must separate suggestions into cancel, downgrade, share, bundle, negotiate or monitor categories.",
      "User feedback such as accepted, dismissed or already-handled must influence future ranking.",
      "Savings claims must disclose assumptions and any partner bias.",
    ],
    workflow: [
      "Recurring items and plan metadata are evaluated against rule packs and market intelligence.",
      "The system computes opportunity size, effort and certainty.",
      "Top actions surface in dashboard, insight feed and targeted alerts.",
      "User actions and outcomes loop back into scoring and monetization analytics.",
    ],
    edgeCases: [
      "Shared family plan looks expensive but is cheaper than separate individual plans.",
      "Price increase is temporary or promotional.",
      "Partner marketplace incentives conflict with the best user outcome.",
      "User depends on a service heavily despite low utilization metrics.",
    ],
    validations: [
      "Partner-originated recommendations must be tagged transparently.",
      "Opportunity values require a calculation trace.",
      "Dismissed recommendations should cool down for a configurable period.",
      "Recommendations must respect household ownership and permission rules.",
    ],
    dependencies: [
      "Merchant and plan intelligence",
      "Recommendation rules engine",
      "Analytics feedback loop",
      "Marketplace integration layer",
    ],
  },
  {
    code: "M",
    title: "AI assistant / chat",
    priority: "Growth",
    description:
      "Provide a conversational finance assistant that can answer recurring-spend questions, summarize changes, explain detections and guide users toward savings actions using grounded product data.",
    businessRules: [
      "Assistant responses must be limited to explain, summarize, compare and recommend; no unsupported financial advice or autonomous money movement.",
      "Responses must cite product facts such as subscriptions, categories and transaction patterns.",
      "If confidence is low, the assistant should ask clarifying questions or fall back to structured help.",
      "Chat history containing financial context must follow privacy and retention controls.",
    ],
    workflow: [
      "User asks a natural-language question such as why recurring spend rose this month.",
      "Intent router queries relevant structured datasets and policy filters.",
      "A grounded response is generated with explanation, action suggestions and optional links.",
      "The product captures follow-up questions, satisfaction and action conversion.",
    ],
    edgeCases: [
      "Ambiguous merchant names or merged subscriptions.",
      "Queries spanning private and shared data in the same household.",
      "Unsupported questions such as tax advice or credit approval predictions.",
      "Multilingual or mixed-language prompts.",
    ],
    validations: [
      "Assistant must never fabricate merchants, prices or user actions.",
      "Unsafe intents must be routed to help content or support.",
      "Long answers should be summarized for mobile readability.",
      "Model prompts must exclude unnecessary raw PII.",
    ],
    dependencies: [
      "LLM orchestration",
      "Retrieval layer",
      "Policy guardrails",
      "Observability and feedback pipeline",
    ],
  },
  {
    code: "N",
    title: "Budgeting intelligence",
    priority: "Growth",
    description:
      "Translate recurring spend into budgeting guidance by separating fixed obligations from flexible subscriptions, forecasting upcoming monthly load and flagging when recurring spend is crowding out savings capacity.",
    businessRules: [
      "Budgeting logic should treat recurring essentials differently from discretionary subscriptions.",
      "Income can be user-entered, detected from salary-like credits, or imported from partner flows, but confidence must be explicit.",
      "Budget pressure alerts should focus on affordability and trajectory, not guilt-based messaging.",
      "Budget guidance must be optional and editable by the user.",
    ],
    workflow: [
      "User provides income context or the system infers recurring inflows.",
      "Recurring expenses are bucketed into essential, flexible and optimization candidates.",
      "The platform forecasts next-month recurring load and compares it with available buffer.",
      "Savings suggestions are reframed as budget relief opportunities.",
    ],
    edgeCases: [
      "Irregular income, freelance payments or seasonal bonuses.",
      "Annual premiums making one month appear overburdened.",
      "Joint households with asymmetric contribution patterns.",
      "Users who do not want income-linked analysis.",
    ],
    validations: [
      "Forecast confidence should be shown when income or bills are variable.",
      "Budget recommendations must remain editable and never overwrite user targets.",
      "Essential expenses should not be recommended for cancellation-like actions.",
      "Currency and localization rules must support future global rollout.",
    ],
    dependencies: [
      "Categorization engine",
      "Income inference or manual entry",
      "Forecasting logic",
      "Dashboard analytics",
    ],
  },
  {
    code: "O",
    title: "Recurring trend analysis",
    priority: "MVP Core",
    description:
      "Analyze recurring-spend trajectory across months, quarters and seasons, showing new additions, removals, price changes, volatility, category shifts and household-level optimization progress.",
    businessRules: [
      "Trend analytics should operate on normalized monthly recurring value and actual billed spend separately.",
      "The system must explain whether movement is caused by new services, price hikes, utilities variability or ownership changes.",
      "Historical views must survive disconnected bank accounts.",
      "Trend calculations must account for manual edits and confirmation state.",
    ],
    workflow: [
      "The analytics layer stores recurring snapshots by item, household and month.",
      "Dashboard renders deltas, stacked category movement and notable anomalies.",
      "AI narratives summarize the largest drivers of change.",
      "Users can drill down to item-level reasons and action history.",
    ],
    edgeCases: [
      "Annual renewals skewing one month or quarter.",
      "Paused services resuming after long inactivity.",
      "Merchant normalization changing retroactively.",
      "Backfilled transactions altering prior month analysis.",
    ],
    validations: [
      "Every delta should trace to item-level facts.",
      "Backfill jobs must re-compute aggregates without double counting.",
      "Month-end cutoffs and timezone treatment must be consistent.",
      "Trend charts must clearly label incomplete current periods.",
    ],
    dependencies: [
      "Analytics warehouse",
      "Historical snapshot jobs",
      "Merchant normalization",
      "Insight generation layer",
    ],
  },
];

function BulletList({ items }: { items: string[] }) {
  return (
    <Stack gap={6}>
      {items.map((item, index) => (
        <Text key={index} size="small" style={{ margin: 0 }}>
          - {item}
        </Text>
      ))}
    </Stack>
  );
}

function RequirementCard({ item }: { item: Requirement }) {
  return (
    <Card collapsible defaultOpen={item.code === "A" || item.code === "D" || item.code === "I"}>
      <CardHeader trailing={<Pill size="sm" tone={item.priority === "Growth" ? "info" : "warning"}>{item.priority}</Pill>}>
        {item.code}. {item.title}
      </CardHeader>
      <CardBody>
        <Stack gap={14}>
          <Text style={{ margin: 0 }}>{item.description}</Text>
          <Grid columns={2} gap={16}>
            <Stack gap={8}>
              <H3>Business rules</H3>
              <BulletList items={item.businessRules} />
            </Stack>
            <Stack gap={8}>
              <H3>Workflow</H3>
              <BulletList items={item.workflow} />
            </Stack>
          </Grid>
          <Grid columns={2} gap={16}>
            <Stack gap={8}>
              <H3>Edge cases</H3>
              <BulletList items={item.edgeCases} />
            </Stack>
            <Stack gap={8}>
              <H3>Validations</H3>
              <BulletList items={item.validations} />
            </Stack>
          </Grid>
          <Stack gap={8}>
            <H3>Dependencies</H3>
            <BulletList items={item.dependencies} />
          </Stack>
        </Stack>
      </CardBody>
    </Card>
  );
}

function FlowCard({
  title,
  subtitle,
  points,
}: {
  title: string;
  subtitle: string;
  points: string[];
}) {
  const theme = useHostTheme();

  return (
    <div
      style={{
        border: `1px solid ${theme.stroke.secondary}`,
        borderRadius: 10,
        padding: 14,
        background: theme.bg.elevated,
      }}
    >
      <Stack gap={8}>
        <Text weight="semibold" style={{ margin: 0 }}>
          {title}
        </Text>
        <Text tone="secondary" size="small" style={{ margin: 0 }}>
          {subtitle}
        </Text>
        <BulletList items={points} />
      </Stack>
    </div>
  );
}

function OverviewSection() {
  return (
    <Stack gap={18}>
      <H2>1-4. Executive, Problem, Goals and Vision</H2>
      <Grid columns="1.5fr 1fr" gap={18}>
        <Stack gap={12}>
          <Text style={{ margin: 0 }}>
            SubSense AI addresses a structurally under-served consumer-fintech problem: recurring spend is growing, fragmented and poorly understood. Users accumulate OTT plans, app-store charges, memberships, broadband, utilities, postpaid bills and small autopay commitments across cards, bank accounts and family members, yet most personal-finance tools still optimize around budgets or wealth tracking rather than recurring-spend intelligence.
          </Text>
          <Text style={{ margin: 0 }}>
            The business opportunity is to become the operating system for recurring household spend: detect it, organize it, explain it, optimize it and eventually distribute smarter plan choices through partner channels. India is a strong initial market because digital subscriptions, telco bundles, autopay behavior and Account Aggregator infrastructure create high-frequency recurring data and strong need for simplification.
          </Text>
          <Text style={{ margin: 0 }}>
            The solution is an AI-enhanced but not AI-dependent platform: deterministic transaction analysis and merchant normalization provide the trust foundation, while AI converts structured signals into useful narratives, recommendations and conversational support. This makes the product defensible, cost-aware and suitable for regulated fintech environments.
          </Text>
          <Text style={{ margin: 0 }}>
            Competitive advantage comes from combining subscription intelligence, household context, utility tracking, India-first bank connectivity, premium UX and a recommendation engine built for actionability. Expected business impact includes stronger consumer engagement, defensible paid conversion, B2B API potential for banks and wellness partners, and measurable savings outcomes that create referral momentum.
          </Text>
        </Stack>
        <Card>
          <CardHeader>Business impact thesis</CardHeader>
          <CardBody>
            <Stack gap={10}>
              <Text style={{ margin: 0 }}>SubSense AI should create value across four layers:</Text>
              <BulletList
                items={[
                  "Consumer trust through clear visibility into recurring obligations",
                  "Direct savings realization through duplicate removal, plan downsell and utility optimization",
                  "Premium monetization from ongoing intelligence rather than static dashboards",
                  "Platform leverage through bank, financial-wellness and embedded-fintech partnerships",
                ]}
              />
            </Stack>
          </CardBody>
        </Card>
      </Grid>

      <H3>2. Business problem statement</H3>
      <Table
        headers={["Problem", "Observed market reality", "User impact", "Implication for SubSense AI"]}
        rows={[
          [
            "Subscription sprawl",
            "Users hold multiple OTT, cloud, music, app and membership plans across payment methods",
            "They lose track of what is active, shared or still valuable",
            "Product must provide one consolidated recurring-spend source of truth",
          ],
          [
            "Recurring expense invisibility",
            "Utilities and autopay obligations are often treated separately from subscriptions",
            "Users underestimate fixed monthly load and have weak forecasting ability",
            "Platform must unify fixed, variable and entertainment recurring spend in one model",
          ],
          [
            "OTT overload",
            "Urban Indian households often subscribe to overlapping entertainment services and bundles",
            "Users pay for duplicated content access and low-utilization plans",
            "Savings engine must identify overlap, bundle mismatch and share-plan opportunities",
          ],
          [
            "Forgotten subscriptions",
            "Free trials convert quietly and annual renewals are easy to miss",
            "Leakage happens in small amounts that compound over time",
            "Renewal, trial-ending and dormant-subscription alerts are critical activation hooks",
          ],
          [
            "Household inefficiency",
            "Plans are paid by different family members without shared visibility",
            "The same service may be bought twice and costs are not allocated fairly",
            "Household setup, member roles and split-aware analytics are strategic differentiators",
          ],
          [
            "Lack of recurring intelligence",
            "Traditional PFM tools categorize spend but do not deeply reason about recurring behavior",
            "Users see statements, not decisions",
            "AI should explain trends and recommend next best actions on top of deterministic analytics",
          ],
        ]}
        striped
      />

      <H3>3. Business goals and objectives</H3>
      <Table headers={["Goal area", "12-24 month target", "Why it matters"]} rows={goalsRows} striped />

      <H3>4. Product vision</H3>
      <Grid columns={3} gap={16}>
        <Card>
          <CardHeader>Long-term vision</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "Become the default recurring-spend intelligence layer for consumers and households.",
                "Evolve from visibility and control into proactive optimization and embedded financial actions.",
                "Expand from India-first mobile app into a globally adaptable recurring-expense platform.",
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>AI direction</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "Use AI for explanation, prioritization, assistant UX and personalization.",
                "Keep detection, compliance-critical logic and savings calculations deterministic wherever possible.",
                "Continuously tune insight relevance using user interaction and savings outcomes.",
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Platform evolution</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "Consumer app to household platform to partner APIs.",
                "Recurring intelligence engine to marketplace and embedded-finance distribution layer.",
                "India-specific bank integrations first, then global open-banking connectors.",
              ]}
            />
          </CardBody>
        </Card>
      </Grid>
    </Stack>
  );
}

function UsersSection() {
  return (
    <Stack gap={18}>
      <H2>5-6. Target Users, Journey and Onboarding</H2>

      <H3>5. Detailed personas</H3>
      <Table
        headers={["Persona", "Profile", "Behavior pattern", "Key frustrations", "Primary need"]}
        rows={personasRows}
        striped
      />

      <H3>6. User journey and onboarding flow</H3>
      <Callout tone="info" title="Wireframe interpretation used in this BRD">
        The initial UX foundation is the supplied sequence of household selection, essential recurring expense setup, subscription setup, authentication and analytics dashboard. This BRD preserves that value-first sequence and expands it into a lower-friction onboarding model that proves usefulness before heavy permission requests.
      </Callout>

      <Grid columns={3} gap={16}>
        <FlowCard
          title="Stage 1: Household framing"
          subtitle="Start with context, not compliance"
          points={[
            "Ask whether the user is managing only self, couple, family or shared household.",
            "Capture who usually pays recurring bills and whether shared plans exist.",
            "Psychology: users engage more easily when the app speaks to their real life unit, not a generic finance account.",
          ]}
        />
        <FlowCard
          title="Stage 2: Essential recurring expenses"
          subtitle="Normalize fixed obligations before talking about subscriptions"
          points={[
            "Prompt for utilities, broadband, postpaid, maintenance, rent-like obligations and insurance reminders.",
            "Show that the app understands recurring essentials, not only entertainment plans.",
            "Psychology: builds seriousness and trust, positioning the product as a household optimizer rather than a novelty app.",
          ]}
        />
        <FlowCard
          title="Stage 3: Subscription seed setup"
          subtitle="Create immediate pattern recognition"
          points={[
            "Let users select known subscriptions or add a few manually from memory.",
            "Pre-seeding improves first-dashboard richness even before bank data arrives.",
            "Psychology: fast wins create commitment and make the later link-bank step feel value additive, not invasive.",
          ]}
        />
        <FlowCard
          title="Stage 4: Authentication"
          subtitle="Commit only after value is visible"
          points={[
            "Ask for sign-in only when saving setup, syncing across devices or linking financial data.",
            "Preserve draft context so registration feels like continuation, not interruption.",
            "Psychology: delayed authentication reduces cognitive and trust friction in the first minute.",
          ]}
        />
        <FlowCard
          title="Stage 5: Account linking"
          subtitle="Turn promise into intelligence"
          points={[
            "Offer AA-based bank connection with clear consent language and a skip option.",
            "Explain exactly what data is used: recurring detection, trends, duplicates and savings suggestions.",
            "Psychology: purpose-specific messaging increases consent completion compared with generic access requests.",
          ]}
        />
        <FlowCard
          title="Stage 6: Dashboard activation"
          subtitle="Deliver the first aha moment"
          points={[
            "Show monthly recurring total, category split, renewals, duplicate risks and one or two high-confidence savings suggestions.",
            "Provide clear next actions: confirm detected items, invite family, add missing bills or review recommendations.",
            "Psychology: the first dashboard must create clarity and control immediately, not just data density.",
          ]}
        />
      </Grid>

      <H3>UX rationale and conversion optimization logic</H3>
      <Table
        headers={["Journey step", "Conversion purpose", "UX rationale", "Primary KPI"]}
        rows={[
          [
            "Household selection",
            "Personalize the product frame within the first screen",
            "A household lens makes the app feel more relevant than a generic money tracker and improves recommendation quality later",
            "Start rate to next screen",
          ],
          [
            "Essential recurring expense setup",
            "Broaden perceived product scope beyond OTT",
            "Users who see utilities included are more likely to view the app as a financial operating tool",
            "Onboarding continuation rate",
          ],
          [
            "Subscription setup",
            "Create immediate dashboard density and self-recognition",
            "Memory-based input reduces empty-state risk and supports later matching",
            "Seed-item count per user",
          ],
          [
            "Authentication",
            "Convert intent into persistent account",
            "Delayed sign-up occurs after demonstrated value rather than before it",
            "Registration completion rate",
          ],
          [
            "Bank linking",
            "Unlock automation and defensibility",
            "Purpose-led consent messaging performs better than a generic connect-your-bank request",
            "Consent completion rate",
          ],
          [
            "Dashboard activation",
            "Create trust and future habit loops",
            "Actionable insights and visible savings potential are stronger than passive charts alone",
            "First-session action rate",
          ],
        ]}
        striped
      />

      <H3>Onboarding design principles</H3>
      <BulletList
        items={[
          "Value-first onboarding: ask users for meaningful context before requesting sensitive permissions.",
          "Progressive disclosure: move from household identity to recurring obligations to financial data access.",
          "Immediate payoff: dashboard should not require perfect data completeness to feel useful.",
          "Trust design: explain why every data request exists and what the user gets in return.",
          "Premium simplicity: reduce jargon and prioritize elegant review flows over spreadsheet-like complexity.",
        ]}
      />
    </Stack>
  );
}

function FunctionalSection() {
  return (
    <Stack gap={18}>
      <H2>7, 11, 12, 13 and 14. Functional Requirements and Product Modules</H2>
      <Callout tone="warning" title="Product principle">
        The platform must remain AI-enhanced but not AI-dependent. Any core function required for baseline user trust, compliance or savings calculations must have a deterministic fallback path.
      </Callout>

      <H3>7. Detailed functional requirements</H3>
      <Stack gap={12}>
        {functionalRequirements.map((item) => (
          <RequirementCard key={item.code} item={item} />
        ))}
      </Stack>

      <Divider />

      <H3>11. Household management module</H3>
      <Table
        headers={["Capability", "Requirement", "Business intent", "Release bias"]}
        rows={[
          [
            "Family tracking",
            "Support owner, admin, member and viewer roles with configurable privacy and invite flows",
            "Allows the platform to model how recurring spend actually happens across households",
            "MVP",
          ],
          [
            "Shared subscriptions",
            "Mark plans as shared and attribute payer, beneficiaries and utilization context",
            "Needed to detect duplication and justify family-plan recommendations",
            "MVP",
          ],
          [
            "Cost splitting",
            "Support equal split, fixed custom split and owner-pays modes",
            "Improves fairness and reinforces household value proposition",
            "Growth",
          ],
          [
            "Household analytics",
            "Show total recurring burden, member contribution, category mix and optimization opportunities",
            "Transforms individual savings tool into family financial-intelligence platform",
            "MVP",
          ],
          [
            "Household benchmarking",
            "Offer anonymized comparison against similar household size and profile cohorts",
            "Creates differentiation and premium upsell narrative",
            "Growth",
          ],
          [
            "Permissioned visibility",
            "Private expenses remain excluded from shared detail views but can optionally contribute to top-line household totals",
            "Balances usefulness with trust and privacy",
            "MVP",
          ],
        ]}
        striped
      />

      <H3>12. Analytics and dashboards</H3>
      <Table
        headers={["Dashboard widget / view", "What it shows", "Why it matters"]}
        rows={[
          [
            "Recurring spend summary",
            "Monthly normalized recurring total, confirmed item count, linked accounts and last refresh",
            "Creates immediate top-line clarity and trust",
          ],
          [
            "Category analysis",
            "Entertainment, utilities, productivity, family, mobility, education and other recurring buckets",
            "Helps users understand recurring-spend composition, not just totals",
          ],
          [
            "Savings potential",
            "Estimated monthly and annual optimization value with prioritized actions",
            "Directly supports paid conversion and retention",
          ],
          [
            "Renewal calendar",
            "Upcoming renewals, trial conversions and due dates over the next 30-45 days",
            "Turns visibility into timely behavior change",
          ],
          [
            "Duplicate subscriptions",
            "Potential overlaps by merchant, household member or bundle relationship",
            "A high-signal differentiator versus generic PFM tools",
          ],
          [
            "Trend analysis",
            "Month-over-month recurring movement with reasons: new service, price increase, utility spike or churn",
            "Builds understanding and strengthens AI explanation quality",
          ],
          [
            "Household comparison",
            "Member contribution, shared-plan burden and benchmark context",
            "Makes the product relevant beyond individual users",
          ],
          [
            "Insight feed",
            "Short AI-generated narratives with evidence-backed savings suggestions",
            "Creates a premium, sticky experience layer on top of analytics",
          ],
        ]}
        striped
      />

      <H3>13. Notifications and alerts</H3>
      <Table
        headers={["Trigger", "Logic", "Preferred channels", "Suppression / control rule"]}
        rows={[
          [
            "Upcoming renewal",
            "Renewal within configurable lead window based on cadence and user preference",
            "Push, in-app, optional email",
            "Suppress once user dismisses or marks handled for the cycle",
          ],
          [
            "Price increase",
            "Current bill exceeds learned baseline beyond category threshold",
            "Push plus in-app detail",
            "Require high-confidence amount comparison and merchant continuity",
          ],
          [
            "Duplicate subscription",
            "Same or substitutable service detected across household members or overlapping bundles",
            "In-app and push for high-confidence cases",
            "Do not repeat once dismissed unless evidence materially changes",
          ],
          [
            "Failed recurring payment",
            "Payment reversal, failed debit or due-date miss signal",
            "Push, in-app, optional email",
            "Must not trigger when data freshness is stale or ambiguous",
          ],
          [
            "Unusual recurring spend",
            "Variable recurring item materially exceeds expected range",
            "Push and insight feed",
            "Throttle to avoid alerting on minor seasonal variation",
          ],
          [
            "AI recommendation",
            "High-priority, high-confidence savings opportunity becomes available",
            "In-app first, push for important items",
            "Respect recommendation fatigue controls and user engagement history",
          ],
        ]}
        striped
      />

      <H3>14. Savings and optimization engine</H3>
      <Table
        headers={["Optimization use case", "Input signals", "Recommended action", "Business value"]}
        rows={[
          [
            "OTT optimization",
            "Content overlap, low utilization, duplicate household ownership, bundle mismatch",
            "Cancel, rotate, switch to family plan or consolidate to bundled offer",
            "High user-visible savings and clear differentiation",
          ],
          [
            "Duplicate subscription reduction",
            "Same merchant or substitutable merchant across members/accounts",
            "Merge to one plan or shift to shared ownership",
            "Creates measurable household savings",
          ],
          [
            "Utility optimization",
            "Rising variance, unusual seasonality, expensive provider pattern",
            "Monitor, compare, renegotiate or adjust plan where supported by partners",
            "Expands product relevance beyond OTT",
          ],
          [
            "Annual vs monthly plan choice",
            "Stable long-term use and known merchant pricing behavior",
            "Move to annual if net savings exceeds threshold and user affordability is suitable",
            "Improves financial-intelligence credibility",
          ],
          [
            "Dormant recurring cost reduction",
            "Low engagement with user-confirmed low-importance plan",
            "Pause or cancel recommendation",
            "Supports recurring savings outcomes and retention",
          ],
          [
            "Budget pressure relief",
            "Recurring load approaching affordability threshold",
            "Prioritize non-essential cuts and lower-cost substitutes",
            "Connects recurring intelligence to financial wellness",
          ],
        ]}
        striped
      />
    </Stack>
  );
}

function PlatformSection() {
  return (
    <Stack gap={18}>
      <H2>8, 9, 10, 17 and 18. Platform, AI, Integration and Security</H2>

      <H3>8. Non-functional requirements</H3>
      <Table
        headers={["Area", "Requirement", "Target / principle"]}
        rows={[
          ["Scalability", "Architecture must support rapid growth in linked accounts, recurring items and event volume", "Design for at least 1M MAU and stepwise horizontal scaling of ingestion, analytics and notification services"],
          ["Performance", "App must feel premium on mid-range Android and modern iOS devices", "Cold start below 2.5s p75; dashboard API under 2s p75 after data availability"],
          ["Availability", "Core consumer experience must remain reliable even when upstream bank systems degrade", "99.9% monthly uptime target with graceful degradation and cached dashboard states"],
          ["Reliability", "Financial event processing must be durable and auditable", "Idempotent ingestion and webhook handling; RPO under 15 minutes; RTO under 4 hours"],
          ["Security", "Financial and identity data must be protected at rest, in transit and in use", "AES-256 at rest, TLS 1.2+, secrets in managed KMS/HSM-backed services, least-privilege access"],
          ["Observability", "Every critical flow must be measurable and debuggable", "Centralized logs, traces, SLO alerts, data-quality monitors and audit trails"],
          ["Mobile responsiveness", "Primary experience must optimize for mobile-first consumers", "Layouts tuned for 360px+ widths with adaptive chart and table behavior"],
          ["Accessibility", "Product must be inclusive and readable", "WCAG 2.1 AA-aligned contrast, screen-reader labels and tap-target compliance"],
          ["Compliance", "Product must support India launch and future global privacy expectations", "DPDP-aware controls, RBI AA ecosystem compliance, GDPR-style minimization and deletion principles"],
          ["Latency targets", "Operational intelligence must feel near real-time", "Webhook acknowledgement under 5s, transaction normalization under 2 minutes, notifications under 5 minutes from event"],
        ]}
        striped
      />

      <H3>9. AI and intelligence layer</H3>
      <Table
        headers={["Capability", "Preferred logic split", "Why AI is used", "Why deterministic logic remains primary"]}
        rows={[
          [
            "Recurring subscription detection",
            "Deterministic cadence rules + ML confidence scoring",
            "Improves precision on messy merchant names and irregular billing patterns",
            "Users need explainable, auditable recurring classification",
          ],
          [
            "Merchant normalization",
            "Rules and alias graph first, embedding or model fallback second",
            "Helps resolve noisy statement descriptions and merchant variants",
            "Known merchants should resolve cheaply and consistently without LLM cost",
          ],
          [
            "Savings recommendation narratives",
            "Deterministic recommendation engine + AI phrasing",
            "Turns structured savings opportunities into human-readable guidance",
            "Savings value and recommendation eligibility must remain traceable",
          ],
          [
            "Conversational assistant",
            "Grounded retrieval + policy layer + LLM generation",
            "Natural-language explanation improves discoverability and premium feel",
            "Structured retrieval prevents fabricated advice and reduces hallucination risk",
          ],
          [
            "Household benchmark summaries",
            "Statistical computation + AI summarization",
            "AI can explain what the benchmark means in plain language",
            "Comparative values must remain cohort-based and mathematically controlled",
          ],
        ]}
        striped
      />

      <Callout tone="info" title="AI cost optimization strategy">
        Run AI only at high-value moments: new monthly summary generation, important savings opportunities, user-initiated assistant queries and benchmark explanation. Use deterministic heuristics for classification and ranking, cache generated narratives, batch low-priority summary jobs and route simpler enrichment tasks to compact models before using larger models.
      </Callout>

      <H3>10. Aggregator / bank integration requirements</H3>
      <Table
        headers={["Integration area", "Requirement", "Implementation note"]}
        rows={[
          [
            "Setu AA consent flow",
            "Initiate explicit read-only consent with purpose text for recurring-intelligence usage",
            "Consent copy must clearly state detection, analytics and insight generation purposes",
          ],
          [
            "Account selection",
            "Allow users to choose one or multiple accounts and map them to personal or household scope",
            "Reduce user fear by supporting selective linking rather than all-accounts-only flows",
          ],
          [
            "Transaction ingestion",
            "Fetch and store account metadata, transactions and refresh statuses with lineage to consent artifacts",
            "Every batch requires idempotency keys and source timestamps",
          ],
          [
            "Recurring analysis pipeline",
            "Normalize raw transactions, cluster merchants, detect cadence and populate recurring suggestions",
            "Pipeline must tolerate incomplete descriptors and backfill corrections",
          ],
          [
            "Webhook processing",
            "Process consent, account and data-availability events securely and idempotently",
            "Signature verification, retry handling, dead-letter queue and replay tooling are mandatory",
          ],
          [
            "Connection lifecycle",
            "Track initiated, pending, active, refresh due, expired, revoked and error states",
            "User-facing repair flows must explain the next action needed",
          ],
          [
            "Fallback manual flow",
            "If bank linking is skipped or unavailable, enable full manual recurring setup with limited automation",
            "Prevents activation loss from aggregator friction or bank coverage gaps",
          ],
        ]}
        striped
      />

      <H3>Bank connection lifecycle and normalization requirements</H3>
      <BulletList
        items={[
          "Every transaction record should retain raw description, normalized merchant candidate, account reference, amount, timestamp, direction, confidence metadata and source lineage.",
          "Normalization must handle statement noise, abbreviations, UPI remarks, app-store generic labels and bank-specific descriptor patterns.",
          "Webhook and polling flows must coexist because upstream freshness can vary by bank and consent context.",
          "If consent expires, historical analytics remain available but all automation must clearly display stale-data status.",
          "Duplicate transaction suppression is required when the same bank account or joint account is linked through multiple members.",
        ]}
      />

      <H3>17. Technical architecture overview</H3>
      <Grid columns={5} gap={14}>
        <Card>
          <CardHeader>Experience layer</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "Mobile apps as primary channel",
                "Responsive web for support and growth surfaces",
                "Partner or embedded modules for banks and wellness platforms",
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Integration layer</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "Setu AA and future open-banking connectors",
                "Notification providers",
                "Plan intelligence and marketplace partner feeds",
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Core domain layer</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "Identity, household, permissions and consent",
                "Subscription, utility and recurring-ledger services",
                "Recommendation and notification rules",
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Data and intelligence</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "Transaction normalization pipeline",
                "Merchant graph and recurring detection engine",
                "Analytics warehouse and AI orchestration",
              ]}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>Trust layer</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "Encryption, audit logging and monitoring",
                "Policy enforcement and privacy controls",
                "Incident response and operational tooling",
              ]}
            />
          </CardBody>
        </Card>
      </Grid>

      <Text style={{ margin: 0 }}>
        Business-facing architectural principle: SubSense AI should be modular enough that recurring intelligence can power three surfaces from the same core engine: the consumer mobile app, partner white-label journeys, and enterprise APIs. This keeps product investment compounding rather than fragmenting into channel-specific logic.
      </Text>

      <H3>18. Security and compliance</H3>
      <Table
        headers={["Control area", "Requirement", "Why it matters"]}
        rows={[
          [
            "Data encryption",
            "Encrypt financial, identity and consent data at rest and in transit; rotate keys through managed infrastructure",
            "Core trust requirement for handling bank-derived transaction data",
          ],
          [
            "Consent management",
            "Store consent scope, purpose, timestamps, revocation status and source artifact history",
            "Essential for AA ecosystem compliance and consumer transparency",
          ],
          [
            "PII protection",
            "Minimize exposed data in logs, prompts, analytics and shared household views",
            "Reduces breach impact and privacy risk",
          ],
          [
            "Audit logging",
            "Track authentication, consent changes, household permission changes, exports, deletions and high-risk admin actions",
            "Needed for forensics, support and regulatory defensibility",
          ],
          [
            "Access control",
            "Enforce least privilege for internal staff and service-to-service access with clear separation of duties",
            "Protects against misuse and internal overreach",
          ],
          [
            "Privacy principles",
            "Apply minimization, purpose limitation, user access, correction and deletion flows inspired by GDPR-style governance",
            "Supports India launch while preparing for global expansion",
          ],
          [
            "Secure AI usage",
            "Exclude unnecessary raw PII from prompts and retain model interaction logs safely",
            "Prevents avoidable data leakage through AI systems",
          ],
          [
            "RBI AA considerations",
            "Respect data-use scope, consent validity, revocation flows and downstream storage controls",
            "Critical for operating responsibly within India's financial-data ecosystem",
          ],
        ]}
        striped
      />
    </Stack>
  );
}

function BusinessSection() {
  return (
    <Stack gap={18}>
      <H2>15, 16, 20, 21 and 23. Monetization, Market, KPIs and Strategic Risk</H2>

      <H3>15. Monetization model</H3>
      <Table
        headers={["Plan", "Indicative pricing", "Included capabilities", "Strategic purpose"]}
        rows={[
          [
            "Free",
            "INR 0",
            "1 household, limited linked accounts, manual tracking, basic dashboard, essential reminders, monthly insight digest",
            "Acquisition, trust building and top-of-funnel data generation",
          ],
          [
            "Pro",
            "INR 199/month or INR 1,499/year",
            "Unlimited recurring items, advanced AI insights, duplicate detection, price increase alerts, optimization engine, trend analytics",
            "Primary individual monetization tier",
          ],
          [
            "Family",
            "INR 299/month or INR 2,499/year",
            "Multi-member household, shared analytics, privacy controls, split-aware recommendations, household benchmarking",
            "Higher ARPU tier aligned to the strongest differentiation",
          ],
          [
            "Enterprise APIs",
            "Custom contract pricing",
            "Recurring-detection APIs, insights APIs, white-label widgets, benchmark intelligence and partner analytics",
            "B2B leverage with banks, payroll, wellness and fintech partners",
          ],
        ]}
        striped
      />

      <H3>Additional revenue streams</H3>
      <Table
        headers={["Revenue stream", "Description", "Guardrail"]}
        rows={[
          [
            "Affiliate commissions",
            "Earn when users switch plans, adopt bundles or purchase partner offers that genuinely improve value",
            "Recommendations must disclose partner influence and prioritize user outcome over commission",
          ],
          [
            "Bank partnerships",
            "License recurring-intelligence capabilities into banking or AA-led consumer experiences",
            "Protect consumer brand trust by keeping consent and data-use boundaries explicit",
          ],
          [
            "Financial wellness platforms",
            "Offer embedded dashboards and insights to employers, payroll providers and wellness programs",
            "Use white-label or co-branded models with strong privacy partitioning",
          ],
          [
            "Marketplace opportunities",
            "Curated plan-switching, bundled OTT, broadband or utilities optimization journeys",
            "Avoid overwhelming the core product with ad-like commerce behavior",
          ],
        ]}
        striped
      />

      <H3>16. Market analysis and competitor positioning</H3>
      <Table
        headers={["Competitor", "Strength", "Gap relative to SubSense AI opportunity", "Differentiation strategy"]}
        rows={[
          [
            "Rocket Money",
            "Strong subscription-focused UX and savings framing",
            "US-centric bank and cancellation experience; weak India AA and household utility context",
            "Win with India-first integrations, utilities and family intelligence",
          ],
          [
            "Truebill",
            "Established recurring-bill framing and consumer savings narrative",
            "Not tailored for India's payment, utility and household behaviors",
            "Offer localized recurring model and premium fintech UX",
          ],
          [
            "CRED",
            "Strong affluent audience, premium design and payment engagement",
            "Recurring intelligence is not its core product system",
            "Own the subscription-and-recurring layer more deeply",
          ],
          [
            "INDmoney",
            "Strong wealth and portfolio orientation",
            "Less focused on subscription optimization and household recurring management",
            "Position as the recurring-spend specialist rather than broad wealth dashboard",
          ],
          [
            "Walnut",
            "Useful spend tracking heritage and India familiarity",
            "Legacy-style tracking with less premium UX and weaker AI/optimization depth",
            "Provide superior modern experience, insights and household logic",
          ],
          [
            "Mint",
            "Legacy benchmark for financial aggregation",
            "Weak current relevance, limited modern subscription-depth and no India-first focus",
            "Build a contemporary recurring-intelligence product instead of generic PFM",
          ],
        ]}
        striped
      />

      <Text style={{ margin: 0 }}>
        Core market gap: most players either treat subscriptions as one feature inside a broader finance product, or treat savings as a service layer without deep recurring-intelligence architecture. SubSense AI should own recurring behavior as the center of gravity and widen outward into household optimization, AI explanation and partner distribution.
      </Text>

      <H3>20. Business metrics and KPIs</H3>
      <Table
        headers={["Metric", "Definition", "Target / benchmark intent"]}
        rows={[
          ["MAU", "Monthly active users interacting with dashboard, alerts or assistant", "Core scale and habit metric"],
          ["Activation rate", "Users reaching dashboard with at least one confirmed recurring item", "Above 70% of completed onboarding users"],
          ["Bank-link rate", "Share of activated users who connect at least one account", "Above 45% in India launch cohorts"],
          ["Detection accuracy", "Precision and recall of recurring identification on labeled sets", "Precision above 90% for high-confidence suggestions"],
          ["D30 retention", "Users active 30 days after signup", "Above 40% for activated cohorts"],
          ["Premium conversion", "Free-to-paid conversion rate", "4-7% by year two with household tier uplift"],
          ["Monthly recurring revenue", "Paid subscription and contracted B2B revenue", "Core monetization health metric"],
          ["CAC", "Blended acquisition cost by channel", "Must decline as partnership mix increases"],
          ["LTV / CAC", "Lifetime value divided by acquisition cost", "Target above 3x on mature paid cohorts"],
          ["AI engagement", "Insight open rate, assistant sessions and recommendation interaction", "Used to evaluate whether AI drives retention or just curiosity"],
          ["Savings realized", "User-acknowledged or inferred recurring savings after actions", "Key proof-of-value metric"],
          ["Churn", "Paid subscriber churn and free-user inactivity churn", "Paid churn below 3.5% monthly"],
        ]}
        striped
      />

      <H3>21. Risks and challenges</H3>
      <Table
        headers={["Risk", "Impact", "Likelihood", "Mitigation"]}
        rows={[
          [
            "Banking integration coverage gaps",
            "Lower automation, weaker activation and slower trust formation",
            "Medium",
            "Preserve strong manual flows, support multi-partner strategy later and keep dashboard valuable without full automation",
          ],
          [
            "Recurring detection false positives",
            "Trust erosion and recommendation quality decay",
            "Medium-High",
            "Use confidence thresholds, review-first UX, explainability and labeled feedback loops",
          ],
          [
            "AI inaccuracies or hallucinations",
            "User distrust and compliance exposure",
            "Medium",
            "Ground all outputs in structured facts, suppress low-confidence outputs and monitor response quality",
          ],
          [
            "Privacy concerns around financial data",
            "Lower bank-link conversion and reputational risk",
            "High",
            "Value-first consent messaging, transparent purpose statements, strong controls and clear deletion rights",
          ],
          [
            "CAC inflation",
            "Weak consumer unit economics",
            "Medium-High",
            "Lean into partnerships, referral loops and high-retention premium value rather than paid media dependence",
          ],
          [
            "Compliance changes in fintech or privacy regulation",
            "Operational rework and go-to-market delay",
            "Medium",
            "Design consent, retention and audit controls conservatively from day one",
          ],
          [
            "User behavior is episodic",
            "Low engagement between renewal events",
            "Medium",
            "Use alerts, monthly insights, household views and savings journeys to create repeat engagement loops",
          ],
          [
            "Partner monetization bias",
            "Users may distrust savings recommendations that appear commercially motivated",
            "Medium",
            "Tag partner-linked suggestions and keep user-benefit scoring primary",
          ],
        ]}
        striped
      />

      <H3>23. Future opportunities</H3>
      <Table
        headers={["Opportunity", "Why it matters", "Capability needed"]}
        rows={[
          [
            "AI financial coach",
            "Moves product from insight feed to ongoing behavior-change assistant",
            "Deeper conversational grounding, memory and goal tracking",
          ],
          [
            "Autonomous savings recommendations",
            "Lets the app sequence and prioritize recurring-spend optimization without manual browsing",
            "High-confidence recommendation scoring and partner-action orchestration",
          ],
          [
            "Smart cancellation engine",
            "Turns insight into direct action and stronger measurable savings",
            "Merchant workflows, partner integrations and user authorization flows",
          ],
          [
            "Credit optimization",
            "Connect recurring-spend behavior to credit-card benefits or bill-payment strategy",
            "Card-benefit graph and partner decisioning logic",
          ],
          [
            "Subscription marketplace",
            "Creates revenue and acquisition leverage through plan switching and bundles",
            "Offer catalog, attribution, recommendation governance and partner economics",
          ],
          [
            "Embedded fintech partnerships",
            "Expands distribution and B2B revenue without recreating the core intelligence engine",
            "Partner APIs, white-label controls and data isolation architecture",
          ],
        ]}
        striped
      />
    </Stack>
  );
}

function RoadmapSection() {
  return (
    <Stack gap={18}>
      <H2>19, 22 and 24. Scalability, Delivery Roadmap and Appendix</H2>

      <H3>19. Scalability roadmap</H3>
      <Table
        headers={["Stage", "Product posture", "Platform focus", "Expansion unlock"]}
        rows={[
          [
            "MVP",
            "India-first mobile app with bank linking, recurring detection, manual tracking, dashboard and savings suggestions",
            "Single-region deployment, strong observability, deterministic core logic, lightweight AI summaries",
            "Consumer validation and product-market fit around recurring visibility",
          ],
          [
            "Growth",
            "Households, benchmarking, richer alerts, assistant UX and broader merchant intelligence",
            "Horizontal scaling of ingestion, analytics and notification services; stronger data-quality tooling",
            "Improved retention, paid conversion and partner readiness",
          ],
          [
            "AI evolution",
            "More personalized insights, multilingual support, goal-based coaching and deeper forecasting",
            "Model routing, feedback learning, prompt safety and cost governance",
            "Premium moat and stronger engagement frequency",
          ],
          [
            "B2B API platform",
            "Expose recurring-detection and savings-intelligence services to partners",
            "Tenant isolation, rate limiting, partner reporting, SLA-backed APIs",
            "Enterprise monetization and distribution scale",
          ],
          [
            "Embedded finance future",
            "Plan switching, cancellation orchestration, credit or bill optimization journeys",
            "Action orchestration, partner settlement, compliance and workflow engines",
            "End-to-end recurring-expense operating platform",
          ],
        ]}
        striped
      />

      <H3>22. Phased delivery roadmap</H3>
      <Table
        headers={["Phase", "Estimated timeline", "Primary scope", "Dependencies", "Exit criteria"]}
        rows={[
          [
            "Phase 1: MVP",
            "4-6 months",
            "Mobile onboarding, auth, household setup, bank linking, recurring detection, manual entry, core dashboard, reminders and basic savings engine",
            "Design system, Setu AA integration, transaction model, notification service",
            "Users can connect accounts, see recurring spend and act on at least one optimization suggestion",
          ],
          [
            "Phase 2: Growth",
            "6-9 months after MVP start",
            "Household invites, shared analytics, deeper trend views, duplicate detection refinement, premium plans and better alerts",
            "Permissions model, benchmark data preparation, pricing/paywall system",
            "Premium monetization live and household value proposition validated",
          ],
          [
            "Phase 3: AI platform",
            "9-12 months after MVP start",
            "Assistant chat, richer insight feed, budget intelligence, multilingual summaries, recommendation learning",
            "Grounded retrieval, AI safety controls, feedback pipelines",
            "AI drives measurable uplift in retention and recommendation engagement",
          ],
          [
            "Phase 4: B2B APIs",
            "12-18 months after MVP start",
            "Partner APIs, white-label dashboards, enterprise analytics and marketplace integration framework",
            "Tenant isolation, SLA layer, partner contracts and governance",
            "At least one external partner successfully integrates recurring-intelligence capabilities",
          ],
        ]}
        striped
      />

      <H3>24. Appendix</H3>
      <Grid columns={2} gap={16}>
        <Card>
          <CardHeader>Glossary</CardHeader>
          <CardBody>
            <Table
              headers={["Term", "Meaning"]}
              rows={[
                ["Recurring item", "Any subscription, bill or repeated financial obligation tracked by the platform"],
                ["Subscription intelligence", "The set of capabilities that detect, explain and optimize subscription behavior"],
                ["AA", "India's Account Aggregator framework for permissioned data sharing"],
                ["Normalized recurring value", "Monthly-equivalent value used to compare mixed billing cadences"],
                ["Shared subscription", "A recurring plan used by multiple household members"],
                ["Confidence score", "Engine-calculated trust level for a detection or recommendation"],
                ["Savings realization", "Verified or user-confirmed reduction in recurring cost after action"],
              ]}
              striped
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Assumptions</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "India launch assumes enough bank coverage through the chosen AA partner for meaningful early cohorts.",
                "MVP remains read-only with no direct money movement or bill payment initiation.",
                "Users are willing to share recurring-spend data if value and trust are communicated clearly.",
                "Manual flows must remain strong because not every recurring obligation will be auto-detectable.",
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Constraints</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "Transaction descriptor quality can be inconsistent across banks.",
                "Recurring detection quality depends on history depth and merchant normalization maturity.",
                "Privacy expectations are high; overly aggressive AI or partner monetization can damage trust.",
                "Mobile-first simplicity must be preserved even as analytics depth increases.",
              ]}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>Dependencies</CardHeader>
          <CardBody>
            <BulletList
              items={[
                "AA partner integration and webhook reliability",
                "Merchant catalog and plan intelligence quality",
                "Notification infrastructure and analytics instrumentation",
                "Consent, privacy and legal-policy alignment before launch",
              ]}
            />
          </CardBody>
        </Card>
      </Grid>

      <H3>Success criteria</H3>
      <BulletList
        items={[
          "Users can understand their recurring financial commitments within minutes of activation.",
          "The system detects subscriptions and recurring bills accurately enough to earn trust.",
          "Savings recommendations lead to measurable behavior change and monetization support.",
          "Household features make the product meaningfully more valuable than single-user subscription trackers.",
          "Core architecture can support both direct-to-consumer growth and partner distribution without re-platforming.",
        ]}
      />
    </Stack>
  );
}

export default function SubSenseAIBrdCanvas() {
  const theme = useHostTheme();
  const [section, setSection] = useCanvasState<NavKey>("subsense-ai-brd-section", "overview");

  return (
    <Stack
      gap={20}
      style={{
        padding: 24,
        background: theme.bg.editor,
        color: theme.text.primary,
      }}
    >
      <Stack gap={10}>
        <Row align="center" wrap gap={10}>
          <H1>SubSense AI Business Requirements Document</H1>
          <Spacer />
          <Pill active tone="info">India-first</Pill>
          <Pill active tone="success">AI-augmented</Pill>
          <Pill active tone="warning">Mobile-first</Pill>
          <Pill active>Investor-ready</Pill>
        </Row>
        <Text tone="secondary" style={{ margin: 0 }}>
          Enterprise-grade BRD for an AI-powered subscription intelligence and recurring expense management platform designed to launch in India and expand globally.
        </Text>
      </Stack>

      <Grid columns={4} gap={14}>
        <Stat value="60-90 sec" label="Target time to first value" />
        <Stat value="B2C + B2B2C" label="Commercial model" />
        <Stat value="Deterministic first" label="Intelligence principle" />
        <Stat value="Household-centric" label="Core differentiation" />
      </Grid>

      <Callout tone="neutral" title="Document basis">
        This BRD uses the supplied mobile flow as the initial UX reference: household selection, essential recurring expense setup, subscription setup, authentication and analytics dashboard. The document expands that flow into a complete fintech product, operating model and delivery roadmap.
      </Callout>

      <Row gap={8} wrap>
        {navItems.map((item) => (
          <Pill key={item.key} active={section === item.key} onClick={() => setSection(item.key)}>
            {item.label}
          </Pill>
        ))}
      </Row>

      <Divider />

      {section === "overview" && <OverviewSection />}
      {section === "users" && <UsersSection />}
      {section === "functional" && <FunctionalSection />}
      {section === "platform" && <PlatformSection />}
      {section === "business" && <BusinessSection />}
      {section === "roadmap" && <RoadmapSection />}
    </Stack>
  );
}
