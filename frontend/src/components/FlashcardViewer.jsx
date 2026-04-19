import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Lightning, CardsThree } from "@phosphor-icons/react";

export default function FlashcardViewer({ data, onClose }) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!data || !data.cards || data.cards.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm" data-testid="flashcards-empty">
        No flashcards available for this note.
      </div>
    );
  }

  const cards = data.cards;
  const card = cards[idx];

  return (
    <div data-testid="flashcard-viewer" className="py-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <CardsThree weight="duotone" className="w-5 h-5 text-[hsl(var(--primary))]" />
          <h3 className="text-lg font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Flashcards
          </h3>
          <span className="text-xs text-muted-foreground font-mono ml-1">
            {data.subject} / {data.chapter}
          </span>
        </div>
        <span className="font-mono text-xs text-muted-foreground" data-testid="flashcard-counter">
          {idx + 1} / {cards.length}
        </span>
      </div>

      {/* Card */}
      <div
        data-testid="flashcard-card"
        className="glass-card min-h-[220px] flex items-center justify-center cursor-pointer p-8 text-center select-none"
        onClick={() => setFlipped((f) => !f)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={flipped ? "back" : "front"}
            initial={{ opacity: 0, rotateY: 90 }}
            animate={{ opacity: 1, rotateY: 0 }}
            exit={{ opacity: 0, rotateY: -90 }}
            transition={{ duration: 0.25 }}
            className="w-full"
          >
            {!flipped ? (
              <div>
                <span className="overline text-[hsl(var(--primary))] block mb-3">Question</span>
                <p className="text-base font-medium leading-relaxed">{card.front}</p>
                <p className="text-[10px] text-muted-foreground mt-4 font-mono">Click to reveal answer</p>
              </div>
            ) : (
              <div>
                <span className="overline text-[hsl(var(--accent))] block mb-3">Answer</span>
                <p className="text-sm leading-relaxed text-muted-foreground">{card.back}</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-4">
        <button
          data-testid="flashcard-prev"
          disabled={idx === 0}
          onClick={() => { setIdx((i) => i - 1); setFlipped(false); }}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          <ArrowLeft weight="bold" className="w-4 h-4" /> Previous
        </button>
        <div className="flex gap-1">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => { setIdx(i); setFlipped(false); }}
              className={`w-2 h-2 rounded-full transition-colors ${i === idx ? "bg-[hsl(var(--primary))]" : "bg-[hsl(var(--muted))]"}`}
            />
          ))}
        </div>
        <button
          data-testid="flashcard-next"
          disabled={idx === cards.length - 1}
          onClick={() => { setIdx((i) => i + 1); setFlipped(false); }}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
        >
          Next <ArrowRight weight="bold" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
