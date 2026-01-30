// Authentication Related Types

import { ApiResponse } from "./api.types";

/**
 * User object from backend
 */
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Login request payload
 */
export interface LoginRequest {
  emailOrPhonenumber: string;
  password: string;
}

/**
 * Login response from backend
 */
export interface LoginResponse extends ApiResponse<User> {
  token?: string;
}

/**
 * Register request payload
 */
export interface RegisterRequest {
  fullName: string;
  phoneNumber: string;
  password: string;
  email: string;
}

/**
 * Register response from backend
 */
export interface RegisterResponse {
  user: User;
  message?: string;
}

/**
 * Auth error response
 */
export interface AuthError {
  error: string;
  message?: string;
  statusCode?: number;
}
