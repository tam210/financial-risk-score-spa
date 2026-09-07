export type Role = "admin" | "user";

type MockAdmin = {
  username: string;
  password: string;
  role: "admin";
};

type MockUser = {
  username: string;
  password: string;
  role: "user";
  rut: string;
};

type MockAccount = MockAdmin | MockUser;

export type AuthenticatedAccount =
  | { username: string; role: "admin" }
  | { username: string; role: "user"; rut: string };

const MOCK_ACCOUNTS: readonly MockAccount[] = [
  {
    username: "admin",
    password: "adminpass",
    role: "admin",
  },
  {
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
    return { username: account.username, role: account.role };
  }

  return {
    username: account.username,
    role: account.role,
    rut: account.rut,
  };
}
