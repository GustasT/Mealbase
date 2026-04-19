type LoginResponse = {
  ok: true;
  token: string;
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const response = await fetch("http://localhost:3001/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  return data;
}

type ProfileResponse = {
  ok: true;
  user: {
    userId: string;
    email: string;
  };
};

export async function profile(token: string): Promise<ProfileResponse> {
  const response = await fetch("http://localhost:3001/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Profile not found");
  }

  return data;
}
