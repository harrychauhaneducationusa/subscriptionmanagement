import MenuBookRoundedIcon from '@mui/icons-material/MenuBookRounded'
import SavingsRoundedIcon from '@mui/icons-material/SavingsRounded'
import ShowChartRoundedIcon from '@mui/icons-material/ShowChartRounded'
import { Box, Button, Card, CardContent, Container, Stack, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'

const categories = [
  {
    title: 'Budgeting and saving',
    description:
      'Guidance on tracking recurring spend and planning ahead. Articles are illustrative—always validate with your own financial advisor.',
    icon: <SavingsRoundedIcon />,
  },
  {
    title: 'Debt and credit',
    description: 'High-level education on credit health. SubSense does not provide credit scores in the MVP product.',
    icon: <ShowChartRoundedIcon />,
  },
  {
    title: 'Using SubSense',
    description: 'How bank linking, consent, and recurring detection fit together in a read-only, trust-first model.',
    icon: <MenuBookRoundedIcon />,
  },
]

export function LearnPage() {
  return (
    <PublicLayout maxWidth="lg" showMarketingNav>
      <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
        <Stack spacing={1} sx={{ pt: 1, pb: 4 }}>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0.12 }}>
            Learning center
          </Typography>
          <Typography variant="hero" component="h1">
            Personal finance education
          </Typography>
          <Typography color="text.secondary" variant="body1" sx={{ maxWidth: 640 }}>
            Static topic cards below mirror the structure of consumer education hubs like{' '}
            <a href="https://www.rocketmoney.com/learn">Rocket Money Learn</a>—content here is placeholder copy for
            SubSense; replace with authored articles or links to your docs site when ready.
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2.5}
          sx={{ flexWrap: 'wrap' }}
          useFlexGap
        >
          {categories.map((cat) => (
            <Box
              key={cat.title}
              sx={{ flex: '1 1 280px', maxWidth: { md: 'calc(33.333% - 16px)' }, minWidth: 260 }}
            >
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack spacing={1.5}>
                    <Stack alignItems="center" direction="row" spacing={1}>
                      <Typography sx={{ color: 'text.secondary', display: 'flex' }}>{cat.icon}</Typography>
                      <Typography variant="h2" sx={{ fontSize: '1.125rem' }}>
                        {cat.title}
                      </Typography>
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      {cat.description}
                    </Typography>
                    <Button component={RouterLink} size="small" to="#" variant="text" disabled>
                      Read more soon
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Stack>
      </Container>
    </PublicLayout>
  )
}
