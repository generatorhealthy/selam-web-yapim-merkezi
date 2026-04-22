import { MobileHeader } from "@/components/mobile/MobileHeader";
import SpecialistReferralsPanel from "@/components/SpecialistReferralsPanel";

export default function MobileSpecialistReferrals() {
  return (
    <div style={{ background: "hsl(var(--m-bg))", minHeight: "100vh", paddingBottom: 120 }}>
      <MobileHeader showBack largeTitle="Davetlerim" subtitle="Davet ettiğin uzmanlar" />
      <div className="px-5">
        <SpecialistReferralsPanel variant="mobile" />
      </div>
    </div>
  );
}
