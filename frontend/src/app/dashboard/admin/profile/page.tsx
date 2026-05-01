import ProfilePage from '@/components/ProfilePage';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

export default function AdminProfilePage() {
  return <ProfilePage role="admin" allowedRoles={ROLE_GROUPS.ADMIN_ONLY} />;
}
