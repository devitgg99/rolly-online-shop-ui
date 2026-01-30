import type { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse } from "@/types/auth.types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function loginService(loginRequest: LoginRequest): Promise<Response> {
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginRequest),
    });
    return response;
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Network error or server unavailable" }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}

export async function registerService(
  registerRequest: RegisterRequest
): Promise<Response> {
  console.log("📤 Register Request: ", registerRequest);
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
      },
      body: JSON.stringify(registerRequest),
    });

    console.log("📥 Register Response: ", response);
    return response;
  } catch (error) {
    console.error("❌ Register service error:", error);
    return new Response(
      JSON.stringify({ error: "Network error or server unavailable" }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
}