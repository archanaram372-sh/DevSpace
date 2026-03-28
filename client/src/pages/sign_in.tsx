import { useState, type FC } from "react";
import { X, Github, Loader } from "lucide-react";
import { loginWithGithub, verifyTokenWithBackend } from "../services/authService";
import { useNavigate } from "react-router-dom";
import "./sign_in.css";

const Modal: FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => {
  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default function SignInPage() {
  const [openModal, setOpenModal] = useState<"terms" | "privacy" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGitHubLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const { user, token } = await loginWithGithub();
      
      await verifyTokenWithBackend(token);
      
      // Store user info and token in localStorage
      localStorage.setItem("userToken", token);
      localStorage.setItem("userName", user.displayName || user.email || "User");
      localStorage.setItem("userId", user.uid);
      
      navigate("/editor");
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "GitHub login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sign-in-container">
      <div className="sign-in-card">
        {/* Header */}
        <div className="sign-in-header">
          <div className="sign-in-logo">⚡ DEVSPACE</div>
          <button className="sign-in-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="sign-in-content">
          <h1 className="sign-in-title">Code Together</h1>
          
          <p className="sign-in-subtitle">
            Real-time collaborative coding workspace with live cursor tracking and multiplayer editing
          </p>

          {/* Error Message */}
          {error && (
            <div className="sign-in-error">
              {error}
            </div>
          )}

          {/* Features */}
          <div className="sign-in-features">
            <div className="sign-in-feature">
              <span className="sign-in-feature-icon">⚡</span>
              <span>Real-time collaboration</span>
            </div>
            <div className="sign-in-feature">
              <span className="sign-in-feature-icon">👥</span>
              <span>Live cursor tracking</span>
            </div>
            <div className="sign-in-feature">
              <span className="sign-in-feature-icon">💻</span>
              <span>Multi-language support</span>
            </div>
          </div>

          {/* GitHub Button */}
          <div className="sign-in-button-group">
            <button
              onClick={handleGitHubLogin}
              disabled={loading}
              className="sign-in-github-btn"
            >
              {loading ? (
                <>
                  <div className="sign-in-button-spinner" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Github size={18} />
                  <span>Continue with GitHub</span>
                </>
              )}
            </button>
          </div>

          {/* Terms */}
          <div className="sign-in-terms">
            By continuing, you agree to our{" "}
            <button 
              onClick={() => setOpenModal("terms")} 
              className="sign-in-terms-link"
            >
              Terms
            </button>{" "}
            and{" "}
            <button 
              onClick={() => setOpenModal("privacy")} 
              className="sign-in-terms-link"
            >
              Privacy Policy
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {openModal === "terms" && (
        <Modal title="Terms of Service" onClose={() => setOpenModal(null)}>
          <p>This platform is built for collaborative development workflows.</p>
          <p>Users accept responsibility for their code and contributions. DevSpace respects intellectual property and open-source licensing.</p>
        </Modal>
      )}

      {openModal === "privacy" && (
        <Modal title="Privacy Policy" onClose={() => setOpenModal(null)}>
          <p>Your GitHub account data is used only for authentication and identifying your contributions.</p>
          <p>We do not store or share your personal information with third parties. Code execution logs are kept temporarily for debugging purposes.</p>
        </Modal>
      )}
    </div>
  );
}