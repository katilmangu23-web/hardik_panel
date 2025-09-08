import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface UserData {
  email: string;
  username: string;
  isLoggedIn: boolean;
  rememberSession?: boolean;
}

// Simple synchronous obfuscation helpers for localStorage values.
// NOTE: This is not a replacement for real encryption for high-security use cases.
const LOCAL_STORAGE_SECRET = "change_me_to_a_secure_random_value";

function obfuscate(plain: string): string {
  try {
    const secret = LOCAL_STORAGE_SECRET;
    const out: number[] = [];
    for (let i = 0; i < plain.length; i++) {
      out.push(plain.charCodeAt(i) ^ secret.charCodeAt(i % secret.length));
    }
    return btoa(String.fromCharCode(...out));
  } catch (e) {
    return btoa(plain);
  }
}

function deobfuscate(encoded: string): string | null {
  try {
    const raw = atob(encoded);
    const secret = LOCAL_STORAGE_SECRET;
    const out: string[] = [];
    for (let i = 0; i < raw.length; i++) {
      out.push(String.fromCharCode(raw.charCodeAt(i) ^ secret.charCodeAt(i % secret.length)));
    }
    return out.join("");
  } catch (e) {
    return null;
  }
}

export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [warningAcknowledged, setWarningAcknowledged] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    const warningStatus = localStorage.getItem('warningAcknowledged');
    
    if (userData) {
      try {
        const decoded = deobfuscate(userData);
        if (decoded) {
          const parsedUser = JSON.parse(decoded);
          setUser(parsedUser);
        }
      } catch (err) {
        // If deobfuscation/parsing fails, remove the corrupted value
        console.error('Failed to parse stored user data, clearing localStorage user key', err);
        localStorage.removeItem('user');
      }
      setWarningAcknowledged(warningStatus === 'true');
    }
    
    setIsLoading(false);
  }, []);

  const login = (userData: UserData) => {
    setUser(userData);
    try {
      localStorage.setItem('user', obfuscate(JSON.stringify(userData)));
    } catch (err) {
      console.error('Failed to store user in localStorage', err);
    }
  };

  const logout = () => {
    setUser(null);
    setWarningAcknowledged(false);
    localStorage.removeItem('user');
    localStorage.removeItem('warningAcknowledged');
    navigate('/login');
  };

  const acknowledgeWarning = () => {
    setWarningAcknowledged(true);
    localStorage.setItem('warningAcknowledged', 'true');
    console.log('Warning acknowledged, state updated');
  };

  const isAuthenticated = !!user && user.isLoggedIn;
  const canAccessDashboard = isAuthenticated && warningAcknowledged;

  return {
    user,
    isLoading,
    isAuthenticated,
    warningAcknowledged,
    canAccessDashboard,
    login,
    logout,
    acknowledgeWarning,
  };
}
