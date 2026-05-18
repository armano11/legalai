"use client"

import React, { useState, useRef, useEffect, useMemo } from "react"
import { Search, CircleDot } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const SUGGESTIONS = [
  "Anticipatory bail grounds under CrPC",
  "Right to privacy landmark judgments",
  "Section 498A harassment case procedure",
  "Consumer Protection Act 2019 filing",
  "Property partition suit siblings",
  "Cybercrime laws IT Act India",
  "Motor Vehicles Act insurance claim",
  "Industrial Disputes Act 1947",
  "Hindu Marriage Act divorce grounds"
]

const deterministicUnit = (index, salt = 1) => {
  const v = Math.sin((index + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return v - Math.floor(v)
}

const GooeyFilter = () => (
  <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
    <defs>
      <filter id="gooey-effect">
        <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
        <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -8" result="goo" />
        <feComposite in="SourceGraphic" in2="goo" operator="atop" />
      </filter>
    </defs>
  </svg>
)

export function SearchBar({ placeholder = "Search JurisCore™ Intelligence...", onSearch }) {
  const inputRef = useRef(null)
  const [isFocused, setIsFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAnimating, setIsAnimating] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [isClicked, setIsClicked] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const isUnsupportedBrowser = useMemo(() => {
    if (typeof window === "undefined") return false
    const ua = navigator.userAgent.toLowerCase()
    const isSafari = ua.includes("safari") && !ua.includes("chrome") && !ua.includes("chromium")
    const isChromeOniOS = ua.includes("crios")
    return isSafari || isChromeOniOS
  }, [])

  const handleSearch = (e) => {
    const value = e.target.value
    setSearchQuery(value)

    if (value.trim()) {
      const filtered = SUGGESTIONS.filter((item) => item.toLowerCase().includes(value.toLowerCase()))
      setSuggestions(filtered)
    } else {
      setSuggestions([])
    }
  }

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery)
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 1000)
    }
  }

  const handleMouseMove = (e) => {
    if (isFocused) {
      const rect = e.currentTarget.getBoundingClientRect()
      setMousePosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      })
    }
  }

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setIsClicked(true)
    setTimeout(() => setIsClicked(false), 800)
  }

  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isFocused])

  const searchIconVariants = {
    initial: { scale: 1 },
    animate: {
      rotate: isAnimating ? [0, -15, 15, -10, 10, 0] : 0,
      scale: isAnimating ? [1, 1.3, 1] : 1,
      transition: { duration: 0.6, ease: "easeInOut" },
    },
  }

  const suggestionVariants = {
    hidden: (i) => ({
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15, delay: i * 0.05 },
    }),
    visible: (i) => ({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 15, delay: i * 0.07 },
    }),
    exit: (i) => ({
      opacity: 0,
      y: -5,
      scale: 0.9,
      transition: { duration: 0.1, delay: i * 0.03 },
    }),
  }

  const particles = Array.from({ length: isFocused ? 18 : 0 }, (_, i) => {
    const dx = (deterministicUnit(i, 1) - 0.5) * 40
    const dy = (deterministicUnit(i, 2) - 0.5) * 40
    const scale = deterministicUnit(i, 3) * 0.8 + 0.4
    const duration = deterministicUnit(i, 4) * 1.5 + 1.5
    const left = deterministicUnit(i, 5) * 100
    const top = deterministicUnit(i, 6) * 100
    return (
    <motion.div
      key={i}
      initial={{ scale: 0 }}
      animate={{
        x: [0, dx],
        y: [0, dy],
        scale: [0, scale],
        opacity: [0, 0.8, 0],
      }}
      transition={{
        duration,
        ease: "easeInOut",
        repeat: Number.POSITIVE_INFINITY,
        repeatType: "reverse",
      }}
      className="absolute w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        filter: "blur(2px)",
      }}
    />
    )
  })

  const clickParticles = isClicked
    ? Array.from({ length: 14 }, (_, i) => {
        const dx = (deterministicUnit(i, mousePosition.x + 1) - 0.5) * 160
        const dy = (deterministicUnit(i, mousePosition.y + 1) - 0.5) * 160
        const scale = deterministicUnit(i, mousePosition.x + mousePosition.y + 2) * 0.8 + 0.2
        const duration = deterministicUnit(i, mousePosition.x * 0.5 + mousePosition.y * 0.3 + 3) * 0.8 + 0.5
        return (
        <motion.div
          key={`click-${i}`}
          initial={{ x: mousePosition.x, y: mousePosition.y, scale: 0, opacity: 1 }}
          animate={{
            x: mousePosition.x + dx,
            y: mousePosition.y + dy,
            scale,
            opacity: [1, 0],
          }}
          transition={{ duration, ease: "easeOut" }}
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: `rgba(0, 240, 255, 0.8)`,
            boxShadow: "0 0 8px rgba(0, 240, 255, 0.8)",
          }}
        />
      )})
    : null

  return (
    <div className="relative w-full">
      <GooeyFilter />
      <motion.form
        onSubmit={handleSubmit}
        className="relative flex items-center justify-center w-full mx-auto"
        initial={{ width: "100%" }}
        animate={{ scale: isFocused ? 1.02 : 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        onMouseMove={handleMouseMove}
      >
        <motion.div
          className={cn(
            "flex items-center w-full rounded-2xl border relative overflow-hidden backdrop-blur-md h-20",
            isFocused ? "border-transparent shadow-2xl" : "border-border bg-primary/5"
          )}
          animate={{
            boxShadow: isClicked
              ? "0 0 40px rgba(0, 240, 255, 0.5), 0 0 15px rgba(0, 240, 255, 0.7) inset"
              : isFocused
              ? "0 15px 35px rgba(0, 0, 0, 0.4)"
              : "0 0 0 rgba(0, 0, 0, 0)",
          }}
          onClick={handleClick}
        >
          {isFocused && (
            <motion.div
              className="absolute inset-0 -z-10"
              initial={{ opacity: 0 }}
              animate={{
                opacity: 0.1,
                background: [
                  "linear-gradient(90deg, #00F0FF 0%, #8E2DE2 100%)",
                  "linear-gradient(90deg, #8E2DE2 0%, #00F0FF 100%)",
                ],
              }}
              transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
          )}

          <div
            className="absolute inset-0 overflow-hidden rounded-2xl -z-5"
            style={{ filter: isUnsupportedBrowser ? "none" : "url(#gooey-effect)" }}
          >
            {particles}
          </div>

          {isClicked && (
            <>
              <motion.div
                className="absolute inset-0 -z-5 rounded-2xl bg-primary/10"
                initial={{ scale: 0, opacity: 0.7 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </>
          )}

          {clickParticles}

          <motion.div className="pl-6 py-3" variants={searchIconVariants} initial="initial" animate="animate">
            <Search
              size={24}
              strokeWidth={isFocused ? 2.5 : 2}
              className={cn(
                "transition-all duration-300",
                isAnimating ? "text-primary" : isFocused ? "text-primary" : "text-muted-foreground",
              )}
            />
          </motion.div>

          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleSearch}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            className={cn(
              "w-full py-3 px-4 bg-transparent outline-none placeholder:text-slate-600 font-medium text-lg relative z-10",
              isFocused ? "text-foreground tracking-wide" : "text-muted-foreground"
            )}
          />

          <AnimatePresence>
            {searchQuery && (
              <motion.button
                type="submit"
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -20 }}
                whileHover={{
                  scale: 1.05,
                  background: "rgba(0, 240, 255, 0.2)",
                  boxShadow: "0 0 20px rgba(0, 240, 255, 0.3)",
                }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 mr-3 text-sm font-black uppercase tracking-widest rounded-xl bg-primary/10 border border-primary/20 text-primary backdrop-blur-sm transition-all shadow-lg hidden md:block"
              >
                Scan
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.form>

      <AnimatePresence>
        {isFocused && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 w-full mt-2 overflow-hidden bg-[#0A0E17]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-border"
            style={{
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion}
                  custom={index}
                  variants={suggestionVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onClick={() => {
                    setSearchQuery(suggestion)
                    if (onSearch) onSearch(suggestion)
                    setIsFocused(false)
                  }}
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer rounded-lg hover:bg-primary/5 group transition-colors"
                >
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ delay: index * 0.06 }}>
                    <CircleDot size={18} className="text-primary/40 group-hover:text-primary" />
                  </motion.div>
                  <motion.span
                    className="text-muted-foreground group-hover:text-foreground text-sm"
                    initial={{ x: -5, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.08 }}
                  >
                    {suggestion}
                  </motion.span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
