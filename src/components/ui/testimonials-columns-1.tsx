"use client";
import React from "react";
import { motion } from "framer-motion";

export const TestimonialsColumn = (props: {
  className?: string;
  testimonials: {
    text: string;
    image: string;
    name: string;
    role: string;
  }[];
  duration?: number;
}) => {
  return (
    <div className={props.className}>
      <motion.div
        animate={{
          translateY: "-50%",
        }}
        transition={{
          duration: props.duration || 10,
          repeat: Infinity,
          ease: "linear",
          repeatType: "loop",
        }}
        className="flex flex-col gap-6 pb-6"
      >
        {[
          ...new Array(2).fill(0).map((_, index) => (
            <React.Fragment key={index}>
              {props.testimonials.map(({ text, image, name, role }, i) => (
                <div
                  className="p-6 rounded-2xl border border-border bg-primary/[0.02] backdrop-blur-sm max-w-xs w-full hover:border-border/50 transition-all"
                  key={i}
                >
                  <div className="text-sm text-foreground/70 leading-relaxed">{text}</div>
                  <div className="flex items-center gap-3 mt-4">
                    <img
                      width={36}
                      height={36}
                      src={image}
                      alt={name}
                      className="h-9 w-9 rounded-full object-cover border border-border"
                    />
                    <div className="flex flex-col">
                      <div className="text-sm font-bold text-foreground tracking-tight leading-5">
                        {name}
                      </div>
                      <div className="text-xs text-foreground/40 tracking-tight leading-5">
                        {role}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </React.Fragment>
          )),
        ]}
      </motion.div>
    </div>
  );
};
