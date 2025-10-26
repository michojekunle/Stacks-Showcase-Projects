import { Github, ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-8 border-t border-border/50 mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Built on <span className="text-primary font-semibold">Stacks</span> × Secured by{" "}
            <span className="text-secondary font-semibold">Bitcoin</span>
          </p>
          
          <div className="flex items-center gap-6">
            <a
              href="https://github.com/michojekunle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors duration-300 flex items-center gap-2"
              aria-label="GitHub Repository"
            >
              <Github className="w-5 h-5" />
              <span className="text-sm">GitHub</span>
            </a>
            
            <a
              href="https://docs.stacks.co"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-secondary transition-colors duration-300 flex items-center gap-2"
              aria-label="Stacks Documentation"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="text-sm">Docs</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
