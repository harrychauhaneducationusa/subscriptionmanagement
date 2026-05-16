import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded'
import { Box, Button, Container, Divider, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import {
  HeroPhoneScreenshot,
  MarketingFeatureSection,
  TrustStrip,
} from '../components/marketing/MarketingSections'
import { PublicLayout } from '../layouts/PublicLayout'

const M = {
  heroDevice: '/marketing/hero-device.png',
  subscriptions: '/marketing/feature-subscriptions.png',
  spending: '/marketing/feature-spending.png',
  accounts: '/marketing/feature-accounts.png',
} as const

export function LandingPage() {
  return (
    <PublicLayout maxWidth="lg" showMarketingNav>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 1, md: 1.5 } }}>
        <Box
          sx={{
            bgcolor: '#ebebeb',
            borderRadius: { xs: 3, md: 4 },
            px: { xs: 2.5, md: 4 },
            py: { xs: 3, md: 4 },
            boxShadow: '0 1px 0 rgba(0,0,0,0.04)',
          }}
        >
          <Stack spacing={0}>
            <Stack
              alignItems="center"
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 4, md: 6 }}
              sx={{ justifyContent: 'space-between' }}
            >
              <Stack spacing={2.5} sx={{ flex: 1, maxWidth: 560 }}>
                <Typography variant="hero" component="h1">
                  The recurring money app that works for you
                </Typography>
                <Typography color="text.secondary" variant="body1" sx={{ fontSize: '1.05rem', lineHeight: 1.65 }}>
                  Managing recurring bills is easy to lose track of. SubSense helps you see subscriptions, utilities,
                  and household context in one calm view—start manually or add read-only bank data when you are ready.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 0.5 }}>
                  <Button
                    component={RouterLink}
                    endIcon={<ChevronRightRoundedIcon />}
                    size="large"
                    to="/onboarding"
                    variant="contained"
                  >
                    Take control of my finances
                  </Button>
                  <Button component={RouterLink} size="large" to="/session" variant="outlined">
                    Log in
                  </Button>
                </Stack>
              </Stack>
              <Stack alignItems="center" spacing={2} sx={{ flex: 1, width: '100%', maxWidth: 360 }}>
                <HeroPhoneScreenshot
                  alt="SubSense mobile app dashboard showing monthly spend, budget, accounts, and navigation."
                  src={M.heroDevice}
                />
                <Typography color="text.secondary" sx={{ fontSize: '0.8rem', textAlign: 'center' }} variant="body2">
                  Product UI preview—final store screenshots may differ slightly at launch.
                </Typography>
              </Stack>
            </Stack>

            <Divider sx={{ my: { xs: 3, md: 3.25 }, borderColor: 'rgba(0,0,0,0.08)' }} />

            <TrustStrip embedded />

            <Typography
              align="center"
              color="text.secondary"
              sx={{ maxWidth: 600, mx: 'auto', pt: 1.5, fontSize: '0.8125rem', lineHeight: 1.55 }}
              variant="body2"
            >
              SubSense is in active development. We do not claim third-party savings figures; we focus on recurring
              visibility, consent-bound bank access, and explainable recommendations.
            </Typography>
          </Stack>
        </Box>
      </Container>

      <Box sx={{ bgcolor: '#f0f0f0', py: { xs: 4, md: 5 }, mt: { xs: 2, md: 3 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack spacing={1.5} sx={{ maxWidth: 720, mx: 'auto', textAlign: 'center' }}>
            <Typography
              component="p"
              sx={{
                fontSize: { xs: '1.35rem', md: 'clamp(1.4rem, 2.8vw, 1.85rem)' },
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
              }}
            >
              Recurring spend, made legible
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.02rem', lineHeight: 1.65 }} variant="body1">
              No awards show, no breathless savings promises—just a clearer picture of what hits your accounts again
              and again, with the controls that belong to you.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Box component="section" id="features">
        <MarketingFeatureSection
          body="Track subscriptions and bills together, confirm detected recurring items from linked accounts, and pause or resume what you own—cancellation stays in your hands with merchant-native flows."
          ctaLabel="Manage my subscriptions"
          ctaTo="/onboarding"
          imageAlt="Person reviewing subscriptions on a phone while commuting"
          imageSrc={M.subscriptions}
          surface="paper"
          textOnLeft={false}
          title="Get control over your subscriptions"
        />

        <MarketingFeatureSection
          body="Dashboard summaries, category rollups, and in-app alerts highlight renewals and connection health. Read-only aggregation means we help you see patterns—not move money."
          ctaLabel="Track my spending"
          ctaTo="/app/dashboard"
          imageAlt="Person relaxing with coffee while checking finances on a phone"
          imageSrc={M.spending}
          surface="muted"
          textOnLeft
          title="Stay on top of your everyday spending"
        />

        <MarketingFeatureSection
          body="Link accounts through your region’s provider when you choose (for example Plaid or Setu in supported setups). Manual entry always works if you skip linking—your pace, your consent."
          ctaLabel="Connect accounts"
          ctaTo="/onboarding"
          imageAlt="Person outdoors finding balance—metaphor for financial clarity"
          imageSrc={M.accounts}
          surface="paper"
          textOnLeft={false}
          title="Link accounts when you are ready"
        />
      </Box>

      <Box sx={{ bgcolor: '#fafafa', py: { xs: 5, md: 7 } }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          <Stack alignItems="center" spacing={2} sx={{ maxWidth: 520, mx: 'auto', textAlign: 'center' }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.35rem', md: 'clamp(1.45rem, 2.5vw, 1.95rem)' },
                fontWeight: 700,
                lineHeight: 1.2,
              }}
            >
              Ready to see recurring spend clearly?
            </Typography>
            <Button component={RouterLink} size="large" to="/onboarding" variant="contained">
              Get started
            </Button>
          </Stack>
        </Container>
      </Box>
    </PublicLayout>
  )
}
