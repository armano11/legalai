import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="min-h-screen pt-24 pb-6 px-4 md:px-6 bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <TrendingUp className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Analytics</h1>
        <p className="text-muted-foreground">
          Firm-wide analytics will be available once the data pipeline is connected.
        </p>
      </motion.div>
    </div>
  );
}
