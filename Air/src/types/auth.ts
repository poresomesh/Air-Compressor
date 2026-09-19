export interface User {
  id: string;
  name: string;
  role: "admin" | "shift_user";
  assignedShift: "A" | "B" | "C" | "ALL";
}

export interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}