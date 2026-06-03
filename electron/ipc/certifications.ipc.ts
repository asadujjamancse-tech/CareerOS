import { ipcMain } from 'electron'
import { getDatabase } from '../services/database/connection'
import { IPC, ok, fail } from './channels'
import {
  getAllCertifications, getCertificationById, createCertification, updateCertification, softDeleteCertification,
  type GetAllCertsParams, type CreateCertificationParams, type UpdateCertificationParams,
} from '../services/certifications/certifications.service'

export function registerCertificationsHandlers(): void {
  ipcMain.handle(IPC.CERTIFICATIONS.GET_ALL, (_e, params: GetAllCertsParams | undefined) => {
    try { return ok(getAllCertifications(getDatabase(), params ?? {})) }
    catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch certifications') }
  })

  ipcMain.handle(IPC.CERTIFICATIONS.GET_BY_ID, (_e, id: string) => {
    try {
      const cert = getCertificationById(getDatabase(), id)
      if (!cert) return fail('Certification not found', 'NOT_FOUND')
      return ok(cert)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to fetch certification') }
  })

  ipcMain.handle(IPC.CERTIFICATIONS.CREATE, (_e, params: CreateCertificationParams) => {
    try {
      if (!params?.name?.trim()) return fail('Name is required', 'VALIDATION')
      if (!params?.issuer?.trim()) return fail('Issuer is required', 'VALIDATION')
      return ok(createCertification(getDatabase(), params))
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to create certification') }
  })

  ipcMain.handle(IPC.CERTIFICATIONS.UPDATE, (_e, id: string, params: UpdateCertificationParams) => {
    try {
      const updated = updateCertification(getDatabase(), id, params)
      if (!updated) return fail('Certification not found', 'NOT_FOUND')
      return ok(updated)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to update certification') }
  })

  ipcMain.handle(IPC.CERTIFICATIONS.DELETE, (_e, id: string) => {
    try {
      const deleted = softDeleteCertification(getDatabase(), id)
      if (!deleted) return fail('Certification not found', 'NOT_FOUND')
      return ok(undefined)
    } catch (err) { return fail(err instanceof Error ? err.message : 'Failed to delete certification') }
  })
}
