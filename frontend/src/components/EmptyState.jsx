import { motion } from "framer-motion";

const EMPTY_STATE_IMG =
  "https://static.prod-images.emergentagent.com/jobs/3ba5de25-cdd1-4539-b91c-3218a68f29c3/images/a3077d24ab854e11dec29a9c6369fe64b401c9244fa326311aa6e765a1178a75.png";

export default function EmptyState() {
  return (
    <motion.div
      data-testid="empty-state"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-20 px-6"
    >
      <img
        src={EMPTY_STATE_IMG}
        alt="Empty state"
        className="w-48 h-48 object-contain mb-8 opacity-60"
      />
      <h3
        className="text-xl font-black tracking-tight mb-2 text-center"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        Ready to study?
      </h3>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Enter a subject and chapter above to generate structured,
        AI-powered study notes in seconds.
      </p>
    </motion.div>
  );
}
