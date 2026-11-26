import SessionGate from "@/components/auth/SessionGate";
import RequestClaim from "@/features/membership-requests/RequestClaim";

export default function ClaimOrganizationRequestPage() {
  return <SessionGate returnPath="/rattacher-demande"><RequestClaim /></SessionGate>;
}
