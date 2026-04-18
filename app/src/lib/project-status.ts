export type ProjectStatus = "pending" | "approved" | "rejected";

export function getProjectStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "pending":
      return "In curs de aprobare";
    case "approved":
      return "Aprobat";
    case "rejected":
      return "Respins";
    default:
      return status;
  }
}

export function getProjectStatusVariant(
  status: string,
): "warning" | "success" | "destructive" | "secondary" {
  switch (status.toLowerCase()) {
    case "pending":
      return "warning";
    case "approved":
      return "success";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
}
