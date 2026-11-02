export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'student' | 'faculty' | 'admin';
  isVerified: boolean;
  department: string | null;
  studentId: string | null;
  bio: string | null;
  profileComplete: boolean;
}
