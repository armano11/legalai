import { motion } from 'framer-motion';
import { BarChart } from 'lucide-react';

export default function CaseInsights() {
  return (
    <div className="min-h-screen pt-24 pb-6 px-4 md:px-6 bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <BarChart className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Case Insights</h1>
        <p className="text-muted-foreground">
          Analytics and trend data will appear here once connected to your case database.
        </p>
      </motion.div>
    </div>
  );
}
