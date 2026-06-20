import BreadCrumbs from '../../components/BreadCrumbs'
import { usePageSEO } from '../kresla/hooks/usePageSEO'
import AboutHero from './components/AboutHero'
import AboutPhilosophy from './components/AboutPhilosophy'
import AboutStats from './components/AboutStats'
import AboutTimeline from './components/AboutTimeline'
import AboutTeam from './components/AboutTeam'

export default function AboutPage() {
  usePageSEO({
    title: 'About Us — Kresla Furniture',
    description:
      'Discover Kresla: premium materials, precision manufacturing, and a seamless journey from selection to assembly.',
  })

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1360px] px-4 pt-8 sm:px-6 lg:px-8">
        <BreadCrumbs />
      </div>
      <AboutHero />
      <AboutPhilosophy />
      <AboutStats />
      <AboutTimeline />
      <AboutTeam />
    </div>
  )
}
