import { createHashRouter, Navigate } from 'react-router-dom'
import { Shell } from '@shared/components/layout/Shell'
import { ErrorBoundary } from '@shared/components/common/ErrorBoundary'
import { SkillsPage } from '@features/skills/components/SkillsPage'
import { OccupationsPage } from '@features/occupations/components/OccupationsPage'
import { ProjectsPage } from '@features/projects/components/ProjectsPage'
import { CertificationsPage } from '@features/certifications/components/CertificationsPage'
import { VideosPage } from '@features/videos/components/VideosPage'
import { NotesPage } from '@features/notes/components/NotesPage'
import { DocumentsPage } from '@features/documents/components/DocumentsPage'
import { JournalPage } from '@features/journal/components/JournalPage'
import { TagsPage } from '@features/tags/components/TagsPage'

function wrap(element: React.ReactElement): React.ReactElement {
  return <ErrorBoundary>{element}</ErrorBoundary>
}

// HashRouter is required for Electron (file:// protocol has no server to handle path rewrites).
// Each route is individually wrapped in an ErrorBoundary so a crash in one
// module never takes down the whole application.
export const router = createHashRouter([
  {
    path: '/',
    element: <Shell />,
    children: [
      { index: true, element: <Navigate to="/skills" replace /> },
      { path: 'skills',          element: wrap(<SkillsPage />)          },
      { path: 'occupations',     element: wrap(<OccupationsPage />)     },
      { path: 'projects',        element: wrap(<ProjectsPage />)        },
      { path: 'certifications',  element: wrap(<CertificationsPage />)  },
      { path: 'videos',          element: wrap(<VideosPage />)          },
      { path: 'notes',           element: wrap(<NotesPage />)           },
      { path: 'documents',       element: wrap(<DocumentsPage />)       },
      { path: 'journal',         element: wrap(<JournalPage />)         },
      { path: 'tags',            element: wrap(<TagsPage />)            },
    ],
  },
])
