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
import { CareerIntelligencePage } from '@features/career-intelligence/components/CareerIntelligencePage'
import { HomeLabPage } from '@features/home-lab/components/HomeLabPage'
import { InterviewPage } from '@features/interview-questions/components/InterviewPage'
import { LearningDashboardPage } from '@features/learning-dashboard/components/LearningDashboardPage'
import { SkillHubPage } from '@features/skill-hub/components/SkillHubPage'
import { LearningCoachPage } from '@features/learning-coach/components/LearningCoachPage'
import { LearningSystemPage } from '@features/learning-system/components/LearningSystemPage'
import { KnowledgeVaultPage } from '@features/knowledge-vault/components/KnowledgeVaultPage'
import { ChallengeCenterPage } from '@features/challenges/components/ChallengeCenterPage'
import { ScenarioCenterPage } from '@features/scenarios/components/ScenarioCenterPage'
import { GlobalSearchPage } from '@features/search/components/GlobalSearchPage'
import { WorkspacePage } from '@features/workspace/components/WorkspacePage'
import { FloatingPanel } from '@features/workspace/components/FloatingPanel'
import { PlaylistsPage } from '@features/playlists/components/PlaylistsPage'
import { MarkdownWorkspacePage } from '@features/markdown-workspace'
import { CodeWorkspacePage } from '@features/code-workspace'
import { WhiteboardPage } from '@features/whiteboard'
import { KnowledgeGraphPage } from '@features/knowledge-graph'

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
      { index: true, element: <Navigate to="/learning-dashboard" replace /> },
      { path: 'skills',          element: wrap(<SkillsPage />)          },
      { path: 'skills/:skillId', element: wrap(<SkillHubPage />)       },
      { path: 'occupations',     element: wrap(<OccupationsPage />)     },
      { path: 'projects',        element: wrap(<ProjectsPage />)        },
      { path: 'certifications',  element: wrap(<CertificationsPage />)  },
      { path: 'videos',          element: wrap(<VideosPage />)          },
      { path: 'notes',           element: wrap(<NotesPage />)           },
      { path: 'documents',       element: wrap(<DocumentsPage />)       },
      { path: 'journal',         element: wrap(<JournalPage />)         },
      { path: 'tags',                   element: wrap(<TagsPage />)                   },
      { path: 'career-intelligence',    element: wrap(<CareerIntelligencePage />)    },
      { path: 'home-lab',               element: wrap(<HomeLabPage />)               },
      { path: 'interview-questions',    element: wrap(<InterviewPage />)             },
      { path: 'learning-dashboard',     element: wrap(<LearningDashboardPage />)     },
      { path: 'learning-coach',         element: wrap(<LearningCoachPage />)         },
      { path: 'learning-system',        element: wrap(<LearningSystemPage />)        },
      { path: 'knowledge-vault',        element: wrap(<KnowledgeVaultPage />)        },
      { path: 'challenge-center',       element: wrap(<ChallengeCenterPage />)       },
      { path: 'scenario-center',        element: wrap(<ScenarioCenterPage />)        },
      { path: 'search',                 element: wrap(<GlobalSearchPage />)          },
      { path: 'workspace',              element: wrap(<WorkspacePage />)             },
      { path: 'workspace/float',        element: <FloatingPanel />                   },
      { path: 'playlists',              element: wrap(<PlaylistsPage />)             },
      { path: 'markdown-workspace',     element: wrap(<MarkdownWorkspacePage />)     },
      { path: 'code-workspace',         element: wrap(<CodeWorkspacePage />)         },
      { path: 'whiteboard',             element: wrap(<WhiteboardPage />)            },
      { path: 'knowledge-graph',        element: wrap(<KnowledgeGraphPage />)        },
    ],
  },
])
