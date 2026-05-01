// User Models
export interface User {
  id?: string;
  email: string;
  full_name: string;
  location?: string;
  roles: string[];
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
