import { createHashRouter, Navigate } from 'react-router-dom'
import { Shell } from '@shared/components/layout/Shell'
import { SkillsPage } from '@features/skills/components/SkillsPage'
import { OccupationsPage } from '@features/occupations/components/OccupationsPage'
import { ProjectsPage } from '@features/projects/components/ProjectsPage'
import { CertificationsPage } from '@features/certifications/components/CertificationsPage'
import { VideosPage } from '@features/videos/components/VideosPage'
import { NotesPage } from '@features/notes/components/NotesPage'
import { DocumentsPage } from '@features/documents/components/DocumentsPage'
import { JournalPage } from '@features/journal/components/JournalPage'
import { TagsPage } from '@features/tags/components/TagsPage'

// HashRouter is used for Electron compatibility with the file:// protocol
export const router = createHashRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/skills" replace /> },
      { path: 'skills', element: <SkillsPage /> },
      { path: 'occupations', element: <OccupationsPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'certifications', element: <CertificationsPage /> },
      { path: 'videos', element: <VideosPage /> },
      { path: 'notes', element: <NotesPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'journal', element: <JournalPage /> },
      { path: 'tags', element: <TagsPage /> },
    ],
  },
])
