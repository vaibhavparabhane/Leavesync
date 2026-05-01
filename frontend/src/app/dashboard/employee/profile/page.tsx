import ProfilePage from '@/components/ProfilePage';
import { APP_CONSTANTS, ROLE_GROUPS } from '@/config/constants';

export default function EmployeeProfilePage() {
  return <ProfilePage role="employee" allowedRoles={ROLE_GROUPS.ALL} />;
}
