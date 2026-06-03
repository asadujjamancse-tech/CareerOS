import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@shared/components/ui/dialog'
import { Button } from '@shared/components/ui/button'
import { useOccupationsStore } from '../store/occupations.store'

export function DeleteOccupationDialog() {
  const { deletingId, isDeleting, items, cancelDelete, executeDelete } = useOccupationsStore()
  const occupation = items.find(o => o.id === deletingId)

  return (
    <Dialog open={!!deletingId} onOpenChange={open => { if (!open) cancelDelete() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete occupation</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{' '}
            <strong className="text-foreground">{occupation?.title}</strong>?
            All linked skill requirements will also be removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={cancelDelete} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => void executeDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
