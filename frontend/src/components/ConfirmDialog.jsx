import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";

export default function ConfirmDialog({ open, onClose, onConfirm, title = "Are you sure?", description = "This action cannot be undone." }) {
  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent data-testid="confirm-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="confirm-cancel" onClick={() => onClose(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction data-testid="confirm-action" onClick={onConfirm} className="gradient-btn">Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
