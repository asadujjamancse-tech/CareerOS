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
}
