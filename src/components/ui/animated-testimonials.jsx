import { IconArrowLeft, IconArrowRight } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

// Adapting the provided Aceternity Animated Testimonials component for Vite/React

export const AnimatedTestimonials = ({
  testimonials,
  autoplay = false,
  className,
  onAssignCase
}) => {
  const [active, setActive] = useState(0);
  const safeLength = testimonials.length || 1;

  const handleNext = useCallback(() => {
    setActive((prev) => (prev + 1) % safeLength);
  }, [safeLength]);

  const handlePrev = useCallback(() => {
    setActive((prev) => (prev - 1 + safeLength) % safeLength);
  }, [safeLength]);

  const isActive = (index) => {
    return index === active;
  };

  useEffect(() => {
    if (autoplay) {
      const interval = setInterval(handleNext, 5000);
      return () => clearInterval(interval);
    }
  }, [autoplay, handleNext]);

  const rotateByIndex = useMemo(
    () => testimonials.map((_, index) => ((index * 13) % 21) - 10),
    [testimonials]
  );

  return (
    <div className={cn("max-w-sm md:max-w-4xl mx-auto px-4 md:px-8 lg:px-12 py-10", className)}>
      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-20">
        <div>
          <div className="relative h-80 w-full">
            <AnimatePresence>
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.src}
                  initial={{
                    opacity: 0,
                    scale: 0.9,
                    z: -100,
                    rotate: rotateByIndex[index] || 0,
                  }}
                  animate={{
                    opacity: isActive(index) ? 1 : 0.7,
                    scale: isActive(index) ? 1 : 0.95,
                    z: isActive(index) ? 0 : -100,
                    rotate: isActive(index) ? 0 : (rotateByIndex[index] || 0),
                    zIndex: isActive(index)
                      ? 999
                      : testimonials.length + 2 - index,
                    y: isActive(index) ? [0, -80, 0] : 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.9,
                    z: 100,
                    rotate: rotateByIndex[index] || 0,
                  }}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  className="absolute inset-0 origin-bottom"
                >
                  <img
                    src={testimonial.src}
                    alt={testimonial.name}
                    draggable={false}
                    className="h-full w-full rounded-3xl object-cover object-center border border-border"
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
        <div className="flex justify-between flex-col py-4">
          <motion.div
            key={active}
            initial={{
              y: 20,
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: -20,
              opacity: 0,
            }}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <h3 className="text-2xl font-bold text-foreground tracking-tight">
              {testimonials[active].name}
            </h3>
            <p className="text-sm text-muted-foreground font-medium">
              {testimonials[active].designation}
            </p>
            <motion.p className="text-sm text-zinc-300 mt-6 leading-relaxed">
              {testimonials[active].quote.split(" ").map((word, index) => (
                <motion.span
                  key={index}
                  initial={{
                    filter: "blur(10px)",
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    filter: "blur(0px)",
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                    delay: 0.02 * index,
                  }}
                  className="inline-block"
                >
                  {word}&nbsp;
                </motion.span>
              ))}
            </motion.p>
            
            <div className="mt-8 flex gap-3">
               <button 
                onClick={() => onAssignCase && onAssignCase(testimonials[active])}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-full text-sm font-semibold hover:bg-zinc-200 transition-colors">
                 Assign Case to {testimonials[active].name.split(" ")[0]}
               </button>
            </div>
            
          </motion.div>

          <div className="flex gap-4 pt-12 md:pt-0">
            <button
              onClick={handlePrev}
              className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center group/button hover:bg-zinc-800 transition-colors"
            >
              <IconArrowLeft className="h-5 w-5 text-foreground group-hover/button:-rotate-12 transition-transform duration-300" />
            </button>
            <button
              onClick={handleNext}
              className="h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center group/button hover:bg-zinc-800 transition-colors"
            >
              <IconArrowRight className="h-5 w-5 text-foreground group-hover/button:rotate-12 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
