import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BalanceCard } from "@/components/BalanceCard";
import { Activity, TrendingUp, Users, Vote } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 pt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl font-display font-bold mb-3 text-foreground">
                Dashboard
              </h1>
              <p className="text-muted-foreground">
                Overview of your voting activity and DAO statistics
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-1">
                <BalanceCard />
              </div>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
                <StatCard
                  icon={<Vote className="w-6 h-6" />}
                  title="Votes Cast"
                  value="12"
                  change="+3 this week"
                />
                <StatCard
                  icon={<Activity className="w-6 h-6" />}
                  title="Active Proposals"
                  value="5"
                  change="2 ending soon"
                />
                <StatCard
                  icon={<TrendingUp className="w-6 h-6" />}
                  title="Voting Power"
                  value="0.15%"
                  change="of total supply"
                />
                <StatCard
                  icon={<Users className="w-6 h-6" />}
                  title="Total Voters"
                  value="3,421"
                  change="+127 this month"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass rounded-md p-6">
                <h2 className="text-lg font-display font-semibold mb-4 text-foreground">
                  Recent Activity
                </h2>
                <div className="space-y-3">
                  <ActivityItem
                    action="Voted For"
                    proposal="zk-SNARK Protocol Upgrade"
                    time="2 hours ago"
                    amount="10 VOTE"
                  />
                  <ActivityItem
                    action="Minted"
                    proposal="Vote Tokens"
                    time="1 day ago"
                    amount="50 VOTE"
                  />
                  <ActivityItem
                    action="Voted Against"
                    proposal="Gas Limit Increase"
                    time="3 days ago"
                    amount="15 VOTE"
                  />
                </div>
              </div>

              <div className="glass rounded-md p-6">
                <h2 className="text-lg font-display font-semibold mb-4 text-foreground">
                  Your Voting History
                </h2>
                <div className="space-y-3">
                  <VotingHistoryItem
                    title="Treasury Fund Allocation"
                    status="Passed"
                    yourVote="For"
                    result="74% For"
                  />
                  <VotingHistoryItem
                    title="Network Fee Adjustment"
                    status="Rejected"
                    yourVote="Against"
                    result="62% Against"
                  />
                  <VotingHistoryItem
                    title="Developer Grant Program"
                    status="Passed"
                    yourVote="For"
                    result="81% For"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
}

const StatCard = ({ icon, title, value, change }: StatCardProps) => {
  return (
    <div className="glass rounded-md p-5 hover:shadow-lg transition-all duration-200">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-sm bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
      <p className="text-2xl font-display font-semibold text-foreground mb-1">{value}</p>
      <p className="text-xs text-muted-foreground">{change}</p>
    </div>
  );
};

interface ActivityItemProps {
  action: string;
  proposal: string;
  time: string;
  amount: string;
}

const ActivityItem = ({ action, proposal, time, amount }: ActivityItemProps) => {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">
          <span className="text-primary">{action}</span> • {proposal}
        </p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <span className="text-sm font-medium text-foreground">{amount}</span>
    </div>
  );
};

interface VotingHistoryItemProps {
  title: string;
  status: string;
  yourVote: string;
  result: string;
}

const VotingHistoryItem = ({ title, status, yourVote, result }: VotingHistoryItemProps) => {
  return (
    <div className="py-3 border-b border-border/30 last:border-0">
      <div className="flex items-start justify-between mb-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <span className={`text-xs px-2 py-1 rounded ${
          status === "Passed" ? "bg-green-600/10 text-green-600" : "bg-red-600/10 text-red-600"
        }`}>
          {status}
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Your vote: <span className="text-foreground">{yourVote}</span></span>
        <span>Result: <span className="text-foreground">{result}</span></span>
      </div>
    </div>
  );
};

export default Dashboard;
