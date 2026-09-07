export type Role = "admin" | "user";

type MockAdmin = {
  id: string;
  username: string;
  password: string;
  role: "admin";
};

type MockUser = {
  id: string;
  username: string;
  password: string;
  role: "user";
  rut: string;
};

type MockAccount = MockAdmin | MockUser;

export type AuthenticatedAccount =
  | { id: string; username: string; role: "admin" }
  | { id: string; username: string; role: "user"; rut: string };

const MOCK_ACCOUNTS: readonly MockAccount[] = [
  {
    id: "admin-1",
    username: "admin",
    password: "adminpass",
    role: "admin",
  },
  {
    id: "user-1",
    username: "user",
    password: "userpass",
    role: "user",
    rut: "12345678-5",
  },
];

export function authenticate(
  username: string,
  password: string,
): AuthenticatedAccount | null {
  const account = MOCK_ACCOUNTS.find(
    (candidate) =>
      candidate.username === username && candidate.password === password,
  );

  if (!account) {
    return null;
  }

  if (account.role === "admin") {
    return {
      id: account.id,
      username: account.username,
      role: account.role,
    };
  }

  return {
    id: account.id,
    username: account.username,
    role: account.role,
    rut: account.rut,
  };
}
