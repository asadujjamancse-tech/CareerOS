import { registerAppHandlers } from './app.ipc'
import { registerSkillsHandlers, registerSkillCategoriesHandlers } from './skills.ipc'
import { registerProjectsHandlers, registerProjectAssetsHandlers } from './projects.ipc'
import { registerOccupationsHandlers, registerOccupationSkillsHandlers } from './occupations.ipc'
import { registerTagsHandlers } from './tags.ipc'
import { registerNotesHandlers } from './notes.ipc'
import { registerJournalHandlers } from './journal.ipc'
import { registerCertificationsHandlers } from './certifications.ipc'
import { registerVideosHandlers } from './videos.ipc'
import { registerDocumentsHandlers } from './documents.ipc'
import { registerStorageHandlers } from './storage.ipc'
import { registerSearchHandlers } from './search.ipc'
import { registerCareerIntelligenceHandlers } from './career-intelligence.ipc'
import { registerHomeLabsHandlers } from './home-labs.ipc'
import { registerInterviewQuestionsHandlers } from './interview-questions.ipc'
import { registerLearningDashboardHandlers } from './learning-dashboard.ipc'
import { registerSkillHubHandlers } from './skill-hub.ipc'
import { registerSrsHandlers } from './srs.ipc'
import { registerAnnotationsHandlers } from './annotations.ipc'
import { registerKnowledgeColorsHandlers } from './knowledge-colors.ipc'
import { registerChallengesHandlers } from './challenges.ipc'
import { registerScenariosHandlers } from './scenarios.ipc'
import { registerVaultHandlers } from './vault.ipc'
import { registerKnowledgeVaultHandlers } from './knowledge-vault.ipc'
import { registerPDFReaderHandlers } from './pdf-reader.ipc'
import { registerLearningCoachHandlers } from './learning-coach.ipc'
import { registerPlaylistsHandlers } from './playlists.ipc'
import { registerWorkspaceHandlers } from './workspace.ipc'
import { registerMarkdownHandlers } from './markdown.ipc'
import { registerDocxViewerHandlers } from './docx-viewer.ipc'
import { registerCodeWorkspaceHandlers } from './code-workspace.ipc'
import { registerWhiteboardHandlers } from './whiteboard.ipc'
import { registerKnowledgeGraphHandlers } from './knowledge-graph.ipc'

export function registerIpcHandlers(): void {
  registerAppHandlers()
  registerSkillsHandlers()
  registerSkillCategoriesHandlers()
  registerProjectsHandlers()
  registerProjectAssetsHandlers()
  registerOccupationsHandlers()
  registerOccupationSkillsHandlers()
  registerTagsHandlers()
  registerNotesHandlers()
  registerJournalHandlers()
  registerCertificationsHandlers()
  registerVideosHandlers()
  registerDocumentsHandlers()
  registerStorageHandlers()
  registerSearchHandlers()
  registerCareerIntelligenceHandlers()
  registerHomeLabsHandlers()
  registerInterviewQuestionsHandlers()
  registerLearningDashboardHandlers()
  registerSkillHubHandlers()
  registerSrsHandlers()
  registerAnnotationsHandlers()
  registerKnowledgeColorsHandlers()
  registerChallengesHandlers()
  registerScenariosHandlers()
  registerVaultHandlers()
  registerKnowledgeVaultHandlers()
  registerPDFReaderHandlers()
  registerLearningCoachHandlers()
  registerPlaylistsHandlers()
  registerWorkspaceHandlers()
  registerMarkdownHandlers()
  registerDocxViewerHandlers()
  registerCodeWorkspaceHandlers()
  registerWhiteboardHandlers()
  registerKnowledgeGraphHandlers()
}
