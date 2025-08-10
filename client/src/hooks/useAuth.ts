import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      // Clear all cached queries
      queryClient.clear();
      // Force a page reload to reset all state
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      // Even if logout fails, clear cache and redirect
      queryClient.clear();
      window.location.href = "/login";
    }
  };

  const login = async (credentials: { email: string; password: string }) => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    const userData = await response.json();
    
    // Invalidate the auth query to refetch user data
    await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    
    return userData;
  };

  // If there's an error (like 401), the user is not authenticated
  const isAuthenticated = !!user && !error;

  return {
    user,
    isLoading,
    isAuthenticated,
    logout,
    login,
  };
}
