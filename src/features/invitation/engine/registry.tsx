import type { ComponentType } from 'react'
import type { SectionType } from '@/lib/validation/template'
import { ClosingSection, FamilySection, InvitationSection, MessageSection } from './sections/Content'
import { CountdownSection, EventsSection, MapSection, VenueSection } from './sections/Details'
import { HeroSection, type SectionProps } from './sections/Hero'
import { GallerySection, StorySection, VideosSection } from './sections/Media'
import { CoupleSection, PersonSection } from './sections/People'

/** Section type → component. Adding a section type = add a component here + to SECTION_TYPES. */
export const SECTION_COMPONENTS: Record<SectionType, ComponentType<SectionProps>> = {
  hero: HeroSection,
  invitation: InvitationSection,
  couple: CoupleSection,
  bride: (p) => <PersonSection {...p} who="bride" />,
  groom: (p) => <PersonSection {...p} who="groom" />,
  family: FamilySection,
  countdown: CountdownSection,
  message: MessageSection,
  story: StorySection,
  gallery: GallerySection,
  videos: VideosSection,
  events: EventsSection,
  venue: VenueSection,
  map: MapSection,
  closing: ClosingSection,
}
