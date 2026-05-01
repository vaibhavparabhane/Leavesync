import ProfilePage from '@/components/ProfilePage';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

export default function HRProfilePage() {
  return <ProfilePage role="hr" allowedRoles={ROLE_GROUPS.HR_ONLY} />;
}
