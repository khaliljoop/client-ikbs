import SessionGate from "@/components/auth/SessionGate";
import WorkspaceSelection from "@/components/auth/WorkspaceSelection";

export default function WorkspacesPage() {
  return (
    <SessionGate returnPath="/espaces">
      <WorkspaceSelection />
    </SessionGate>
  );
}
