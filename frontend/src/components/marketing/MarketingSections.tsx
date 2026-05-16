import { Box, Button, Container, Stack, Typography } from '@mui/material'
import type { PropsWithChildren } from 'react'
import { Link as RouterLink } from 'react-router-dom'

/** Features / Learn centered like Rocket; logo and CTAs balanced on left/right. */
export function MarketingHeader() {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr auto', md: '1fr auto 1fr' },
        alignItems: 'center',
        gap: { xs: 1, md: 2 },
        py: { xs: 1.25, md: 1.5 },
        width: '100%',
      }}
    >
      <Stack alignItems="center" direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: 'brand.main',
            flexShrink: 0,
          }}
        />
        <Typography
          component={RouterLink}
          sx={{ fontWeight: 800, color: 'text.primary', textDecoration: 'none' }}
          to="/"
          variant="h6"
        >
          SubSense
        </Typography>
      </Stack>

      <Stack
        alignItems="center"
        component="nav"
        direction="row"
        spacing={4}
        sx={{
          display: { xs: 'none', md: 'flex' },
          gridColumn: { md: '2' },
          justifySelf: 'center',
        }}
      >
        <Typography
          component={RouterLink}
          sx={{
            color: 'text.secondary',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
            '&:hover': { color: 'text.primary' },
          }}
          to="/#features"
        >
          Features
        </Typography>
        <Typography
          component={RouterLink}
          sx={{
            color: 'text.secondary',
            textDecoration: 'none',
            fontWeight: 500,
            fontSize: '0.95rem',
            '&:hover': { color: 'text.primary' },
          }}
          to="/learn"
        >
          Learn
        </Typography>
      </Stack>

      <Stack
        alignItems="center"
        direction="row"
        spacing={1}
        sx={{ justifySelf: { xs: 'end', md: 'end' }, gridColumn: { xs: '2', md: '3' } }}
      >
        <Button color="inherit" component={RouterLink} size="small" to="/session">
          Log in
        </Button>
        <Button component={RouterLink} size="small" to="/onboarding" variant="contained">
          Sign up
        </Button>
      </Stack>

      <Stack
        alignItems="center"
        direction="row"
        justifyContent="center"
        spacing={3}
        sx={{ display: { xs: 'flex', md: 'none' }, gridColumn: '1 / -1', pt: 0.5 }}
      >
        <Typography
          component={RouterLink}
          sx={{ color: 'text.secondary', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}
          to="/#features"
        >
          Features
        </Typography>
        <Typography
          component={RouterLink}
          sx={{ color: 'text.secondary', textDecoration: 'none', fontWeight: 500, fontSize: '0.875rem' }}
          to="/learn"
        >
          Learn
        </Typography>
      </Stack>
    </Box>
  )
}

type TrustStripProps = {
  /** Tighter spacing when inside the hero panel */
  embedded?: boolean
}

export function TrustStrip({ embedded }: TrustStripProps) {
  const labels = ['Security-first design', 'Consent-bound data use', 'Transparent insights']

  return (
    <Stack
      alignItems="center"
      direction={{ xs: 'column', sm: 'row' }}
      justifyContent="center"
      spacing={{ xs: 1, sm: 3 }}
      sx={{ py: embedded ? 1 : 3, gap: { sm: 3 } }}
    >
      <Typography
        color="text.secondary"
        sx={{ fontSize: '0.7rem', letterSpacing: '0.12em' }}
        variant="overline"
      >
        Built for trust
      </Typography>
      <Stack
        alignItems="center"
        component="ul"
        direction="row"
        flexWrap="wrap"
        justifyContent="center"
        spacing={2}
        sx={{ listStyle: 'none', m: 0, p: 0 }}
        useFlexGap
      >
        {labels.map((label) => (
          <Typography
            key={label}
            color="text.secondary"
            component="li"
            sx={{ fontWeight: 600, fontSize: '0.85rem' }}
            variant="body2"
          >
            {label}
          </Typography>
        ))}
      </Stack>
    </Stack>
  )
}

type FeatureBandProps = PropsWithChildren<{
  title: string
  body: string
  ctaLabel: string
  ctaTo: string
  textOnLeft?: boolean
}>

export function FeatureBand({ title, body, ctaLabel, ctaTo, textOnLeft = true, children }: FeatureBandProps) {
  return (
    <Stack
      alignItems="center"
      direction={{ xs: 'column', md: 'row' }}
      spacing={4}
      sx={{
        py: { xs: 4, md: 6 },
        flexDirection: { md: textOnLeft ? 'row' : 'row-reverse' },
      }}
    >
      <Stack spacing={2} sx={{ flex: 1, maxWidth: 480 }}>
        <Typography component="h2" variant="h2">
          {title}
        </Typography>
        <Typography color="text.secondary" variant="body1">
          {body}
        </Typography>
        <Box>
          <Button component={RouterLink} sx={{ mt: 1 }} to={ctaTo} variant="outlined">
            {ctaLabel}
          </Button>
        </Box>
      </Stack>
      <Box sx={{ flex: 1, width: '100%', maxWidth: 440 }}>{children}</Box>
    </Stack>
  )
}

export type MarketingFeatureSectionProps = {
  title: string
  body: string
  ctaLabel: string
  ctaTo: string
  imageSrc: string
  imageAlt: string
  /** When true, copy is in the left column on large screens (image on the right). */
  textOnLeft?: boolean
  /** Wide bands that alternate like rocketmoney.com */
  surface?: 'paper' | 'muted'
}

/** Large lifestyle image + copy, full-width surface (Rocket-style feature rows). */
export function MarketingFeatureSection({
  title,
  body,
  ctaLabel,
  ctaTo,
  imageSrc,
  imageAlt,
  textOnLeft = true,
  surface = 'paper',
}: MarketingFeatureSectionProps) {
  const bg = surface === 'muted' ? '#f5f5f5' : '#ffffff'

  return (
    <Box sx={{ bgcolor: bg, py: { xs: 5, md: 8 } }}>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack
          alignItems="center"
          direction={{ xs: 'column', md: textOnLeft ? 'row' : 'row-reverse' }}
          spacing={{ xs: 4, md: 8 }}
        >
          <Box
            sx={{
              flex: 1,
              width: '100%',
              maxWidth: 440,
              borderRadius: 3,
              overflow: 'hidden',
              aspectRatio: '1',
              mx: { xs: 'auto', md: 0 },
              boxShadow: '0 20px 50px rgba(0,0,0,0.08)',
            }}
          >
            <Box
              alt={imageAlt}
              component="img"
              loading="lazy"
              src={imageSrc}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
          <Stack spacing={2} sx={{ flex: 1, maxWidth: 520, alignSelf: { md: 'center' } }}>
            <Typography
              component="h2"
              sx={{
                fontSize: { xs: '1.5rem', md: 'clamp(1.65rem, 2.5vw, 2.125rem)' },
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {title}
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.65 }} variant="body1">
              {body}
            </Typography>
            <Box sx={{ pt: 0.5 }}>
              <Button component={RouterLink} size="large" to={ctaTo} variant="outlined">
                {ctaLabel}
              </Button>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  )
}

type HeroPhoneScreenshotProps = {
  src: string
  alt: string
}

/** Framed phone screenshot for the hero (replace asset when SubSense UI is ready). */
export function HeroPhoneScreenshot({ src, alt }: HeroPhoneScreenshotProps) {
  return (
    <Box sx={{ position: 'relative', mx: 'auto', width: '100%', maxWidth: { xs: 280, sm: 300 } }}>
      <Box
        sx={{
          borderRadius: '2rem',
          p: '10px',
          background: 'linear-gradient(145deg, #2a2a2a 0%, #0f0f0f 100%)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.18)',
        }}
      >
        <Box
          sx={{
            borderRadius: '1.35rem',
            overflow: 'hidden',
            bgcolor: '#000',
            lineHeight: 0,
          }}
        >
          <Box alt={alt} component="img" src={src} sx={{ width: '100%', height: 'auto', display: 'block' }} />
        </Box>
      </Box>
    </Box>
  )
}

export function PhonePreviewMock() {
  return (
    <Box sx={{ position: 'relative', mx: 'auto', maxWidth: 270 }}>
      <Box
        sx={{
          borderRadius: 4,
          border: '1px solid rgba(0,0,0,0.08)',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.8) inset',
        }}
      >
        <Box sx={{ bgcolor: '#fafafa', px: 2, py: 1.25, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
          <Stack alignItems="center" direction="row" justifyContent="space-between">
            <Typography sx={{ fontWeight: 700, fontSize: '0.75rem' }} variant="caption">
              SubSense
            </Typography>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'brand.main' }} />
          </Stack>
        </Box>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ fontSize: '0.72rem', color: 'text.secondary' }} variant="caption">
            Recurring this month
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '1.6rem', letterSpacing: '-0.02em' }} variant="h2">
            ₹12,450
          </Typography>
          <Box
            sx={{
              mt: 2,
              height: 68,
              borderRadius: 2,
              bgcolor: 'rgba(0,0,0,0.03)',
              position: 'relative',
              border: '1px solid rgba(0,0,0,0.04)',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                left: 10,
                right: 10,
                top: '58%',
                borderTop: '1px dashed rgba(0,0,0,0.12)',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                left: 10,
                right: 10,
                bottom: 18,
                height: 2,
                borderRadius: 2,
                bgcolor: 'brand.main',
                opacity: 0.75,
              }}
            />
          </Box>
          <Typography sx={{ mt: 1.25, fontSize: '0.72rem', color: 'success.main', fontWeight: 600 }} variant="caption">
            On track vs last month
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
