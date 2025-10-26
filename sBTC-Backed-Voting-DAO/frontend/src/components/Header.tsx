import { useState } from "react";
import { NavLink } from "react-router-dom";
import { WalletConnectControls } from "./WalletConnectButton";
import { ModeToggle } from "./ModeToggle";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-primary flex items-center justify-center relative">
              <div className="absolute inset-0 bg-secondary opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="text-primary-foreground font-display font-bold text-lg relative z-10">
                V
              </span>
            </div>
            <span className="text-lg font-display font-semibold text-foreground hidden sm:inline">
              Voting DAO
            </span>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <NavLink
              to="/proposals"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Proposals
            </NavLink>
            <NavLink
              to="/vote"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Vote
            </NavLink>
            <NavLink
              to="/mint"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Mint
            </NavLink>
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Dashboard
            </NavLink>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ModeToggle />
          <WalletConnectControls />
          {/* Hamburger Button for Mobile */}
          <button
            className="md:hidden text-foreground focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu with Gradient, Transparency, and Enhanced Blur */}
      <div
        className={`md:hidden fixed top-16 left-0 right-0 not-dark:bg-white/70 not-dark:backdrop-blur-md shadow-md glass transition-all duration-300 ease-in-out z-40 ${
          isMobileMenuOpen
            ? "max-h-screen opacity-100"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <NavLink
            to="/proposals"
            className={({ isActive }) =>
              `text-base font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } animate-subtle-float`
            }
            onClick={toggleMobileMenu}
          >
            Proposals
          </NavLink>
          <NavLink
            to="/vote"
            className={({ isActive }) =>
              `text-base font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } animate-subtle-float`
            }
            onClick={toggleMobileMenu}
          >
            Vote
          </NavLink>
          <NavLink
            to="/mint"
            className={({ isActive }) =>
              `text-base font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } animate-subtle-float`
            }
            onClick={toggleMobileMenu}
          >
            Mint
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `text-base font-medium transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              } animate-subtle-float`
            }
            onClick={toggleMobileMenu}
          >
            Dashboard
          </NavLink>
        </div>
      </div>
    </header>
  );
};
