import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BalanceCard } from "@/components/BalanceCard";
import { ArrowRight, Shield, Vote, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-16">
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-linear-to-b from-primary/5 via-background to-background"></div>
          
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-14 animate-fade-in">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-5 text-foreground">
                sBTC-Backed Voting DAO
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-xl mx-auto leading-relaxed">
                Vote on ZK protocol upgrades with Bitcoin-secured tokens. Participate in decentralized governance powered by Stacks.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link to="/proposals">
                  <Button
                    size="lg"
                    className="cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 py-5 transition-all duration-200"
                  >
                    View Proposals
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                
                <Link to="/vote">
                  <Button
                    variant="outline"
                    size="lg"
                    className="cursor-pointer border border-border hover:bg-muted hover:text-primary font-medium px-6 py-5 transition-all duration-200"
                  >
                    Start Voting
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mb-16 animate-scale-in">
              <BalanceCard />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto mt-16">
              <FeatureCard
                icon={<Shield className="w-7 h-7" />}
                title="Bitcoin Security"
                description="Transactions anchored to Bitcoin blockchain for ultimate security"
              />
              <FeatureCard
                icon={<Vote className="w-7 h-7" />}
                title="Democratic Voting"
                description="Fair and transparent governance using fungible vote tokens"
              />
              <FeatureCard
                icon={<Zap className="w-7 h-7" />}
                title="Fast & Efficient"
                description="Powered by Stacks L2 for quick and low-cost transactions"
              />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => {
  return (
    <div className="glass rounded-md p-6 hover:shadow-lg transition-all duration-200 group">
      <div className="w-14 h-14 rounded-sm bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
        <div className="text-primary">{icon}</div>
      </div>
      <h3 className="text-base font-display font-semibold mb-2 text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
};

export default Index;
