import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface TextThreeProps {
  text?: string
  speed?: number
  className?: string
}

const TextThree: React.FC<TextThreeProps> = ({ 
  text = "Namaste World!", 
  speed = 100,
  className 
}) => {
  const [displayText, setDisplayText] = useState("")

  useEffect(() => {
    setDisplayText("")
    let currentIndex = 0
    const intervalId = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex))
        currentIndex++
      } else {
        clearInterval(intervalId)
      }
    }, speed)

    return () => clearInterval(intervalId)
  }, [text, speed])

  return (
    <div className={className || "flex justify-center items-center h-64 p-4"}>
      <motion.div
        className="text-4xl font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {displayText}
        <span className="animate-pulse">|</span>
      </motion.div>
    </div>
  )
}

export default TextThree
